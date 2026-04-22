import { Injectable } from '@nestjs/common';
import { and, asc, ilike, or, sql, type SQL } from 'drizzle-orm';
import type { AnyPgTable, PgColumn } from 'drizzle-orm/pg-core';
import { DatabaseService } from 'src/database/database.service';
import { AutocompleteOptionDto } from 'src/_utils/dto/responses/autocomplete-option.dto';

@Injectable()
export class AutocompleteHelper {
  constructor(private readonly databaseService: DatabaseService) {}

  autocompleteOptions = async (params: {
    table: AnyPgTable;
    idColumn: PgColumn;
    nameColumn: PgColumn;
    normalizedColumn?: PgColumn;
    additionalWhere?: SQL;
    q: string | undefined;
    limit: number;
  }): Promise<AutocompleteOptionDto[]> => {
    const { table, idColumn, nameColumn, normalizedColumn, additionalWhere, q, limit } = params;
    const safe = this.getSafeAutocompleteTerm(q);
    const pattern = safe ? `%${safe}%` : undefined;

    const nameMatch = pattern
      ? normalizedColumn
        ? or(ilike(nameColumn, pattern), ilike(normalizedColumn, pattern))
        : ilike(nameColumn, pattern)
      : undefined;
    const whereExpr = and(...[additionalWhere, nameMatch].filter((clause): clause is SQL => Boolean(clause)));

    const base = this.databaseService.db
      .select({ id: idColumn, name: nameColumn })
      .from(table)
      .where(whereExpr);

    const query = safe
      ? base.orderBy(
          asc(this.autocompleteNameMatchPriority(nameColumn, safe, { normalizedColumn })),
          asc(nameColumn),
        )
      : base.orderBy(asc(nameColumn));

    const rows = await query.limit(limit);
    return rows.map(row => ({ id: row.id as number, name: row.name as string }));
  };

  getSafeAutocompleteTerm = (q: string | undefined): string | undefined => {
    const trimmed = q?.trim();
    if (!trimmed) return undefined;
    const safe = trimmed.replace(/[%_]/g, '').slice(0, 100);
    return safe || undefined;
  };

  private autocompleteNameTokensStartWith = (nameColumn: PgColumn, prefix: string): SQL =>
    sql`EXISTS (
      SELECT 1
      FROM unnest(
        string_to_array(
          trim(
            regexp_replace(
              regexp_replace(cast(${nameColumn} as text), E'[,\\-\u2013\u2014/]+', ' ', 'g'),
              E'\\s+',
              ' ',
              'g'
            )
          ),
          ' '
        )
      ) AS t(token)
      WHERE btrim(t.token) <> '' AND t.token ILIKE ${prefix}
    )`;

  private autocompleteNameMatchPriority = (
    nameColumn: PgColumn,
    safe: string,
    options?: { normalizedColumn?: PgColumn },
  ): SQL => {
    const prefix = `${safe}%`;
    const contains = `%${safe}%`;
    const norm = options?.normalizedColumn;
    if (norm) {
      return sql`(
        CASE
          WHEN ${nameColumn} ILIKE ${prefix}
            OR ${norm} ILIKE ${prefix}
            OR ${this.autocompleteNameTokensStartWith(nameColumn, prefix)}
            OR ${this.autocompleteNameTokensStartWith(norm, prefix)}
          THEN 0
          WHEN ${nameColumn} ILIKE ${contains} OR ${norm} ILIKE ${contains}
          THEN 1
          ELSE 2
        END
      )`;
    }
    return sql`(
      CASE
        WHEN ${nameColumn} ILIKE ${prefix} OR ${this.autocompleteNameTokensStartWith(nameColumn, prefix)}
        THEN 0
        WHEN ${nameColumn} ILIKE ${contains}
        THEN 1
        ELSE 2
      END
    )`;
  };
}

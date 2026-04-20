import { Types } from 'mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { isObject } from 'class-validator';

export function IsPopulated<T>(document: T | Types.ObjectId | string | null): document is T {
  return !(document instanceof Types.ObjectId || !isObject(document));
}

export function IsPopulatedOrFail<T>(document: T | Types.ObjectId | string | null, name?: string): document is T {
  if (!IsPopulated(document)) throw new InternalServerErrorException(`${name ?? 'document'} is not populated`);
  return true;
}

export function SafePopulated<T>(document: T | Types.ObjectId | string | null): T {
  IsPopulatedOrFail(document);
  return document as T;
}

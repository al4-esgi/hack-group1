import { ValidationOptions } from 'class-validator';
import { Schema } from 'mongoose';

export interface CustomValidationOptions<T> {
  property?: keyof T | '_id' | undefined;
  queries?: Schema.Types.Mixed | undefined;
  excludeDeleted?: boolean | undefined;
}

export type UniqueExistsValidationOptions<T> = CustomValidationOptions<T> & ValidationOptions;

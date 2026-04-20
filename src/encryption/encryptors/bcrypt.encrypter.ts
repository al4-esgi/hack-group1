import * as bcrypt from 'bcrypt';
import { Encrypter } from './template.encrypter';

export class BcryptEncrypter extends Encrypter {
  name: string = 'bcrypt';

  securityLevel: number = 50;

  async encrypt(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

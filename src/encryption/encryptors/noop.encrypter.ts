import { Encrypter } from './template.encrypter';

export class NoopEncrypter extends Encrypter {
  name: string = 'noop';

  securityLevel: number = 0;

  async encrypt(password: string): Promise<string> {
    return password;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return password === hash;
  }
}

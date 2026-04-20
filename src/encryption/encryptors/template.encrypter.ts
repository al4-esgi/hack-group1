export abstract class Encrypter {
  abstract readonly name: string;
  abstract readonly securityLevel: number;

  abstract encrypt(password: string): Promise<string>;
  abstract compare(password: string, hash: string): Promise<boolean>;
}

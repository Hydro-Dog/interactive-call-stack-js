import { LocInterface } from './loc.interface';

export interface VariableDeclaratorInterface {
  id: VariableIDInterface;
  init: VariableInitInterface;
  loc: LocInterface;
  type: 'VariableDeclarator';
}

interface VariableIDInterface {
  type: 'Identifier';
  loc: LocInterface;
  name: string;
}

interface VariableInitInterface {
  value: any;
  raw: string;
  loc: LocInterface;
  type: 'Literal';
}

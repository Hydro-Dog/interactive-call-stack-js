import { LocInterface } from './loc.interface';
import { VariableDeclaratorInterface } from './variable-declarator.interface';

export interface VariableDeclarationInterface {
  declarations: VariableDeclaratorInterface[];
  kind: VariableType;
  loc: LocInterface;
  type: 'VariableDeclaration';
}

type VariableType = 'let' | 'const' | 'var';

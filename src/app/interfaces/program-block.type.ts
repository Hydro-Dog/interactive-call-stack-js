import * as estree from 'estree';
import { LexEnvEntity } from '../app.component';

export type ProgramBlockType =
  | ProgramBlockEnum.ExpressionStatement
  | ProgramBlockEnum.FunctionDeclaration
  | ProgramBlockEnum.VariableDeclaration
  | ProgramBlockEnum.Identifier;

export enum ProgramBlockEnum {
  VariableDeclaration = 'VariableDeclaration',
  FunctionDeclaration = 'FunctionDeclaration',
  FunctionExpression = 'FunctionExpression',
  ExpressionStatement = 'ExpressionStatement',
  ArrowFunctionExpression = 'ArrowFunctionExpression',
  Identifier = 'Identifier',
}

export type ProgramBlock =
  | estree.Directive
  | estree.Statement
  | estree.ModuleDeclaration;

export const lexEnvEmpty: LexEnvEntity = {
  name: 'empty',
  type: 'empty',
  kind: 'empty',
  value: 'empty',
  loc: 'empty',
};

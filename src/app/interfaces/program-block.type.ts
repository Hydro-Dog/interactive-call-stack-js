import * as estree from 'estree';

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

import * as estree from 'estree';

export type ProgramBlockType =
  | ProgramBlockEnum.ExpressionStatement
  | ProgramBlockEnum.FunctionDeclaration
  | ProgramBlockEnum.VariableDeclaration
  | ProgramBlockEnum.Identifier;

export enum ProgramBlockEnum {
  VariableDeclarator = 'VariableDeclarator',
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

export interface LexEnvEntity {
  lexEnvCompleted?: boolean;
  name: string | undefined;
  type:
    | 'ExpressionStatement'
    | 'FunctionDeclaration'
    | 'VariableDeclarator'
    | 'empty';
  kind: 'var' | 'let' | 'const' | 'empty' | null;
  value: string | number | bigint | true | RegExp | null | undefined | 'empty';
  loc: estree.SourceLocation | null | undefined | 'empty';
  lexEnv?: LexEnvEntity;
  scope?: LexEnvEntity[];
  body?: LexEnvEntity[];
}

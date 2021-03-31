export type ProgramBlockType =
  | ProgramBlockEnum.ExpressionStatement
  | ProgramBlockEnum.FunctionDeclaration
  | ProgramBlockEnum.VariableDeclaration
  | ProgramBlockEnum.Identifier;

export enum ProgramBlockEnum {
  VariableDeclaration = 'VariableDeclaration',
  FunctionDeclaration = 'FunctionDeclaration',
  ExpressionStatement = 'ExpressionStatement',
  Identifier = 'Identifier',
}

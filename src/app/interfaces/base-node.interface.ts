import { ProgramBlockInterface } from './program-block.interface';
import { ProgramBlockEnum } from './program-block.type';

interface BaseFunction {
  params: any;
  generator?: boolean;
  async?: boolean;
  body: BlockStatement;
}

export interface FunctionDeclaration extends BaseFunction {
  type: ProgramBlockEnum.FunctionDeclaration;
  id: any;
  body: BlockStatement;
}

export interface BlockStatement {
  type: 'BlockStatement';
  body: ProgramBlockInterface[];
  innerComments?: Array<Comment>;
}

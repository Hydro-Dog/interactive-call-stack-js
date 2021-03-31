import { LocInterface } from './loc.interface';
import { ProgramBlockType } from './program-block.type';

export interface ProgramBlockInterface {
  type: ProgramBlockType;
  loc: LocInterface;
  body: ProgramBlockInterface[];
  params: any;
  expression: any;
  id?: any;
}

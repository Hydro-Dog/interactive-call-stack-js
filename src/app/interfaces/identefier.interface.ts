import { LocInterface } from './loc.interface';
import { ProgramBlockEnum } from './program-block.type';

export interface IdentefierInterface {
  loc: LocInterface;
  name: string;
  type: ProgramBlockEnum.Identifier;
}

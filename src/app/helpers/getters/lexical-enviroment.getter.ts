import { BoundDirectivePropertyAst } from '@angular/compiler';
import { IdentefierInterface } from 'src/app/interfaces/identefier.interface';
import { ProgramBlockInterface } from 'src/app/interfaces/program-block.interface';
import { ProgramBlockEnum } from 'src/app/interfaces/program-block.type';

export const getLexicalEnviroment = (
  body: ProgramBlockInterface[],
  identifiers?: IdentefierInterface[]
) => {
  console.log('body: ', body);
  const bodyVariables = body.filter(
    (programBlock) => programBlock.type === ProgramBlockEnum.VariableDeclaration
  );
  const functionParams = identifiers ? [...identifiers] : [];

  return [bodyVariables, functionParams];
};

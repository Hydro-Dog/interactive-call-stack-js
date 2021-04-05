import { BoundDirectivePropertyAst } from '@angular/compiler';
import { IdentefierInterface } from 'src/app/interfaces/identefier.interface';
import { ProgramBlockInterface } from 'src/app/interfaces/program-block.interface';
import {
  ProgramBlockEnum,
  ProgramBlock,
} from 'src/app/interfaces/program-block.type';
import * as estree from 'estree';

export const getFuncDeclarationsFromBody = (
  body: ProgramBlock[],
  returnType: 'array' | 'map'
) => {
  const resArr: { name: string; block: ProgramBlock }[] = [];

  const entriesArr: any[] = [];

  body.forEach((bodyBlock: ProgramBlock, i: number) => {
    if (bodyBlock.type === ProgramBlockEnum.FunctionDeclaration) {
      entriesArr.push([bodyBlock.id!.name, { ...bodyBlock }]);
      resArr.push({ name: bodyBlock.id!.name, block: { ...bodyBlock } });
    }
    if (
      bodyBlock.type === ProgramBlockEnum.VariableDeclaration &&
      bodyBlock.declarations[0].init?.type ===
        ProgramBlockEnum.FunctionExpression
    ) {
      entriesArr.push([
        (bodyBlock.declarations[0].id as estree.Identifier).name,
        { ...bodyBlock },
      ]);
      resArr.push({
        name: (bodyBlock.declarations[0].id as estree.Identifier).name,
        block: { ...bodyBlock },
      });
    }

    if (
      bodyBlock.type === ProgramBlockEnum.VariableDeclaration &&
      bodyBlock.declarations[0].init?.type ===
        ProgramBlockEnum.ArrowFunctionExpression
    ) {
      entriesArr.push([
        (bodyBlock.declarations[0].id as estree.Identifier).name,
        { ...bodyBlock },
      ]);
      resArr.push({
        name: (bodyBlock.declarations[0].id as estree.Identifier).name,
        block: { ...bodyBlock },
      });
    }
  });

  const resMap = new Map(entriesArr);

  return returnType === 'array' ? resArr : resMap;
};

const getFunCallsFromBody = (
  body: ProgramBlock[],
  returnType: 'array' | 'map'
) => {};

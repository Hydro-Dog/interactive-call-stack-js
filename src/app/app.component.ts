import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { cloneDeep } from 'lodash';
import * as esprima from 'esprima';
import * as estree from 'estree';
import { ProgramBlockEnum } from './interfaces/program-block.type';
import { ExecutionContextService } from './services/execution-context.service';

const NOT_EXECUTED = 'not executed';
const EXECUTED = 'executed';
const FUNCTION_CALL = 'function call';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  codeForm = this.fb.group({
    userInput: '',
  });

  stepIndex = 0;

  private userInput = this.codeForm.get('userInput');

  constructor(
    private fb: FormBuilder,
    private executionContextService: ExecutionContextService
  ) {}

  ngOnInit() {}

  getParentScope(lexEnv: Scope, scopes: Scope[]) {
    const parentScopeName = lexEnv.parentName;
    return scopes.find((x) => x.name === parentScopeName)!;
  }

  onSubmit() {
    const programmString = this.userInput?.value;
    const programm = getParsedScript(programmString) as estree.Program;
    console.log('programm: ', programm);
    generateLexEnvRecursive(programm.body, 'global', 'null');

    generateLexEnvLog(scopes[0].body, scopes[0].lexEnvLog[0]);

    scopes = this.addLexEnvLogs();
    curentLexEnv = scopes[0];

    console.log('scopes: ', scopes);
  }

  addLexEnvLogs() {
    //Нужно привести lexEnvsLogs и body к одинаковому количеству элементов.
    //Или перебирать не lexEnvLog, а body
    const scope = scopes.map((scope) => {
      const copy = cloneDeep(scope.lexEnvLog[0]);
      console.log('gen logs: ', generateLexEnvLog(scope.body, copy));
      return {
        ...scope,
        lexEnvLog: generateLexEnvLog(scope.body, copy),
      };
    });

    return scope;
  }

  nextClicked() {
    console.log('-----------------------------------');
    console.log('curent LexEnv: ', curentLexEnv);

    console.log(
      'indexEl: ',
      curentLexEnv.indexEl,
      'indexEnv: ',
      curentLexEnv.indexEnv
    );
    console.log(
      'curent lexEnvLog el: ',
      curentLexEnv.lexEnvLog[curentLexEnv.indexEnv]
    );

    if (curentLexEnv.lexEnvLog[curentLexEnv.indexEnv]) {
      const currEl =
        curentLexEnv.lexEnvLog[curentLexEnv.indexEnv][curentLexEnv.indexEl];
      console.log('curent elemet: ', currEl);
      //вторая часть условия - говно
      //надо как-то четко детерминировать вызовы функций
      if (
        currEl.type === ProgramBlockEnum.ExpressionStatement &&
        currEl.kind === FUNCTION_CALL
      ) {
        console.log('STEP INSIDE');
        if (!currEl.name) {
          console.warn('native code');
        } else {
          const scope = scopes.find((scope) => scope.name === currEl.name);
          if (!scope) {
            console.warn(
              `no such function declaration with name ${currEl.name}`
            );
          } else {
            curentLexEnv = scope;

            console.log('-----------------------------------');
            console.log('curent LexEnv: ', curentLexEnv);

            console.log(
              'indexEl: ',
              curentLexEnv.indexEl,
              'indexEnv: ',
              curentLexEnv.indexEnv
            );
            console.log(
              'curent lexEnvLog el: ',
              curentLexEnv.lexEnvLog[curentLexEnv.indexEnv]
            );

            if (curentLexEnv.lexEnvLog[curentLexEnv.indexEnv]) {
              const currEl =
                curentLexEnv.lexEnvLog[curentLexEnv.indexEnv][
                  curentLexEnv.indexEl
                ];
              console.log('curent elemet: ', currEl);
            } else {
              this.getParentScope(curentLexEnv, scopes);
              curentLexEnv = this.getParentScope(curentLexEnv, scopes);

              console.log('!!! curentLexEnv', curentLexEnv);
            }
          }
        }
      }
      curentLexEnv.indexEl++;
      curentLexEnv.indexEnv++;
    } else {
      this.getParentScope(curentLexEnv, scopes);
      curentLexEnv = this.getParentScope(curentLexEnv, scopes);

      console.log('!!! curentLexEnv', curentLexEnv);
    }
  }
}

//event soursing (event driven approach) каждое распарсивание - это ивент
//хранить списком FD по uuid, и забить на вложенность

const log = [];
let scopes: Scope[] = [];
let curentLexEnv: Scope;

function generateLexEnvRecursive(
  body: Body,
  name: string,
  parentName: string,
  params?: any[]
) {
  console.log('body: ', body);
  const { envRec, indexEl } = generateFirstStepLexEnv(body);
  scopes.push({
    name,
    body,
    parentName,
    lexEnvLog: [envRec],
    indexEl,
    indexEnv: 1,
    params: params?.length ? [...params] : [],
  });
  body.forEach((entity) => {
    if (entity.type === ProgramBlockEnum.FunctionDeclaration) {
      generateLexEnvRecursive(
        entity!.body!.body,
        entity.id!.name,
        name,
        entity!.params.map((x) => ({
          name: (x as estree.Identifier).name,
          val: null,
        }))
      );
    }
  });

  //set parent lex envs
  scopes = scopes.map((scope1) => {
    const outerEnv = scopes.find((scope2) => scope2.name === scope1.parentName);

    return { ...scope1, outerEnv };
  });
}

function getParsedScript(code: string): esprima.Program {
  return esprima.parseScript(code, {
    tolerant: true,
    loc: true,
  });
}

function generateFirstStepLexEnv(body: Body): {
  envRec: EnviromentRecordEntity[];
  indexEl: number;
} {
  let firstStepLexEnvBody = [];
  let firstStepLexEnv = [];

  const functionDeclarations = body.filter(
    (entity) => entity.type === ProgramBlockEnum.FunctionDeclaration
  );

  const notFunctionDeclarations = body.filter(
    (entity) => entity.type !== ProgramBlockEnum.FunctionDeclaration
  );

  firstStepLexEnvBody = [...functionDeclarations, ...notFunctionDeclarations];

  firstStepLexEnv = firstStepLexEnvBody.map((entity) => {
    let name = '';
    let type = '';
    let kind = '';
    let value: any = '';
    let loc = {};

    switch (entity.type) {
      case ProgramBlockEnum.FunctionDeclaration:
        name = entity.id!.name;
        type = entity.type;
        kind = entity.type;
        value = 'initialized';
        loc = entity.loc!;

        return { name, type, value, loc };
      case ProgramBlockEnum.VariableDeclaration:
        name = (
          (
            (entity as estree.VariableDeclaration)
              .declarations[0] as unknown as estree.VariableDeclarator
          ).id as estree.Identifier
        ).name;
        type = entity.type;
        kind = entity.kind;
        loc = (
          (entity as estree.VariableDeclaration)
            .declarations[0] as unknown as estree.VariableDeclarator
        ).loc!;
        if (entity.kind === 'var') {
          value = 'undefined';
        } else {
          value = 'ininitialized';
        }
        return { name, type, kind, value, loc };
      case ProgramBlockEnum.ExpressionStatement:
        name = (
          (
            (entity as unknown as estree.Directive)
              .expression as unknown as estree.BaseCallExpression
          ).callee as estree.Identifier
        ).name;
        type = 'ExpressionStatement';
        loc = (
          (
            (entity as unknown as estree.Directive)
              .expression as unknown as estree.BaseCallExpression
          ).callee as estree.Identifier
        ).loc!;
        return {
          name,
          type,
          kind: 'function call',
          value: 'not executed',
          loc,
        };
      default:
        return {
          name: 'lol',
          type: 'rofl',
          kind: 'come on',
          value: 'see ya',
          loc: 'hell yeag',
        };
    }
  });

  return {
    envRec: firstStepLexEnv,
    indexEl: functionDeclarations.length,
  };
}

function generateLexEnvLog(
  body: Body,
  lexEnvFirstStep: EnviromentRecordEntity[]
) {
  const resultLog: EnviromentRecordEntity[][] = [lexEnvFirstStep];

  lexEnvFirstStep.forEach((entity, i, array) => {
    if (entity.type === ProgramBlockEnum.VariableDeclaration) {
      const variable = body.find((block) => {
        return (
          block.type === ProgramBlockEnum.VariableDeclaration &&
          getVarName(block) === entity.name
        );
      });

      const newLexEnv = {
        ...entity,
        value:
          getVarValue(variable as estree.VariableDeclaration) ||
          'initialized FD',
      };

      const lexEnvCopy = cloneDeep(resultLog[resultLog.length - 1]);
      lexEnvCopy[i] = newLexEnv;
      resultLog.push(lexEnvCopy as unknown as EnviromentRecordEntity[]);
    }

    if (entity.type === ProgramBlockEnum.ExpressionStatement) {
      const newLexEnv = {
        ...entity,
        value: 'executed',
      };

      const lexEnvCopy = cloneDeep(resultLog[resultLog.length - 1]);
      lexEnvCopy[i] = newLexEnv;
      resultLog.push(lexEnvCopy as unknown as EnviromentRecordEntity[]);
    }
  });
  return resultLog;
}

function getVarValue(block: estree.VariableDeclaration) {
  return (block.declarations[0].init as estree.Literal).value;
}

function getVarName(block: estree.VariableDeclaration) {
  return (block.declarations[0].id as estree.Identifier).name;
}

interface EnviromentRecordEntity {
  name: string;
  type: string;
  kind?: string;
  value: any;
}

interface Scope {
  name: string;
  parentName: string;
  body: Body;
  lexEnvLog: EnviromentRecordEntity[][];
  indexEl: number;
  indexEnv: number;
  params?: Array<{ name: string; val: any }>;
}

type Body = Array<
  | estree.FunctionDeclaration
  | estree.Directive
  | estree.Statement
  | estree.ModuleDeclaration
>;

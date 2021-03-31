export interface LocInterface {
  start: CodeCoordinatesInterface;
  end: CodeCoordinatesInterface;
}

interface CodeCoordinatesInterface {
  line: number;
  column: number;
}

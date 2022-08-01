import { splitCommaSeparated } from '../../../src/util/StringUtil';

describe('StringUtil', (): void => {
  describe('#splitCommaSeparated', (): void => {
    it('splits strings containing commas into parts based on the location of these commas.', (): void => {
      expect(splitCommaSeparated('this,is,a,comma-separated,string'))
        .toEqual([ 'this', 'is', 'a', 'comma-separated', 'string' ]);
    });
    it('handles strings without commas by returning an array containing solely the original string.', (): void => {
      const strVal = 'this string has no commas';
      expect(splitCommaSeparated(strVal)).toEqual([ strVal ]);
    });
  });
});

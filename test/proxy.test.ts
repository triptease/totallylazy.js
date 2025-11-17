import {call, on} from '../src/proxy';

describe('proxy', () => {
    it('', () => {
        class User {
            firstname(): string {
                return 'dan';
            }

            public lastname = 'Bod';

            get fullName(): string {
                return this.firstname() + this.lastname;
            }

            private _age: number = 0;
            set age(value: number) {
                this._age = value;
            }
        }

        expect(call(on(User).firstname().length)).toEqual(['firstname', [], 'length']);
        expect(call(on(User).lastname)).toEqual(['lastname']);
        expect(call(on(User).fullName)).toEqual(['fullName']);
        expect(call((on(User).age = 30))).toEqual(['age', 30]);
    });
});

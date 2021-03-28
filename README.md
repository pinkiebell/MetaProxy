# MetaProxy standard

## Deploy code
```
// PUSH1 11;
// CODESIZE;
// SUB;
// DUP1;
// PUSH1 11;
// RETURNDATASIZE;
// CODECOPY;
// RETURNDATASIZE;
// RETURN;
```

## MetaProxy code
```
// copy args
// CALLDATASIZE;   calldatasize
// RETURNDATASIZE; 0, calldatasize
// RETURNDATASIZE; 0, 0, calldatasize
// CALLDATACOPY;

// RETURNDATASIZE; 0
// RETURNDATASIZE; 0, 0
// RETURNDATASIZE; 0, 0, 0
// RETURNDATASIZE; 0, 0, 0, 0

// PUSH1 54;       54, 0, 0, 0, 0
// DUP1;           54, 54, 0, 0, 0, 0
// CODESIZE;       codesize, 54, 54, 0, 0, 0, 0
// SUB;            codesize-54, 54, 0, 0, 0, 0
// DUP1;           codesize-54, codesize-54, 54, 0, 0, 0, 0
// SWAP2;          54, codesize-54, codesize-54, 0, 0, 0, 0
// CALLDATASIZE;   calldatasize, 54, codesize-54, codesize-54, 0, 0, 0, 0
// CODECOPY;       codesize-54, 0, 0, 0, 0

// CALLDATASIZE;   calldatasize, codesize-54, 0, 0, 0, 0
// ADD;            calldatasize+codesize-54, 0, 0, 0, 0
// RETURNDATASIZE; 0, calldatasize+codesize-54, 0, 0, 0, 0
// PUSH20 0;       addr, 0, calldatasize+codesize-54, 0, 0, 0, 0 - zero is replaced with shl(96, address())
// GAS;            gas, addr, 0, calldatasize+codesize-54, 0, 0, 0, 0
// DELEGATECALL;   (gas, addr, 0, calldatasize() + metadata, 0, 0) delegatecall to the target contract;
//
// RETURNDATASIZE; returndatasize, retcode, 0, 0
// RETURNDATASIZE; returndatasize, returndatasize, retcode, 0, 0
// SWAP4;          0, returndatasize, retcode, 0, returndatasize
// DUP1;           0, 0, returndatasize, retcode, 0, returndatasize
// RETURNDATACOPY; (0, 0, returndatasize) - Copy everything into memory that the call returned

// stack = retcode, 0, returndatasize # this is for either revert(0, returndatasize()) or return (0, returndatasize())

// PUSH1 _SUCCESS_; push jumpdest of _SUCCESS_
// JUMPI;          jump if delegatecall returned `1`
// REVERT;         (0, returndatasize()) if delegatecall returned `0`
// JUMPDEST _SUCCESS_;
// RETURN;         (0, returndatasize()) if delegatecall returned non-zero (1)
```

## Development

Use `docker-compose up dev` to initialize the environment and `docker-compose run --rm dev -i` to enter it.
Lastly, `docker-compose down` stops/removes any running containers.

Use `yarn test` or `yarn coverage` in the environment to run the tests.

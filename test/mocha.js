import assert from 'assert';
import fs from 'fs';
import ethers from 'ethers';

const Artifacts = {};
const files = fs.readdirSync('build/contracts');

for (const file of files) {
  if (!file.endsWith('.json')) {
    continue;
  }

  const blob = JSON.parse(fs.readFileSync(`build/contracts/${file}`));
  Artifacts[blob.contractName] = blob;
}

function getDefaultWallets () {
  const rootProvider = new ethers.providers.JsonRpcProvider(process.env.ROOT_RPC_URL);
  const baseKey = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b750120';

  return {
    rootProvider,
    alice: new ethers.Wallet(baseKey + '0', rootProvider),
    bob: new ethers.Wallet(baseKey + '1', rootProvider),
    charlie: new ethers.Wallet(baseKey + '2', rootProvider),
    daniel: new ethers.Wallet(baseKey + '3', rootProvider),
    eva: new ethers.Wallet(baseKey + '4', rootProvider),
  };
}

async function deploy (artifact, wallet, ...args) {
  const _factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );
  const contract = await _factory.deploy(...args);
  await contract.deployTransaction.wait();

  return contract;
}

async function assertRevert (tx) {
  let reverted = false;

  try {
    await (await tx).wait();
  } catch (e) {
    reverted = e.code === 'CALL_EXCEPTION';
  }

  assert.ok(reverted, 'Expected revert');
}

Object.assign(
  globalThis,
  {
    assert,
    assertRevert,
    Artifacts,
    getDefaultWallets,
    deploy,
    ethers,
  }
);

console.info(`*** ROOT_RPC_URL=${process.env.ROOT_RPC_URL} ***`);

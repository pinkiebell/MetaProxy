
describe('SimpleMock', () => {
  const { alice, bob, charlie } = getDefaultWallets();
  const ARGS = [alice.address, bob.address, ~~(Date.now() / 1000), 3600, [charlie.address], [4144]];
  let simpleMock;
  let childContract;

  before('Prepare contracts', async () => {
    simpleMock = await deploy(Artifacts.SimpleMock, alice);
  });

  function doRound (fromCalldata) {
    const tag = fromCalldata ? 'createFromCalldata' : 'createFromBytes';
    const args = fromCalldata ? ARGS : Array.from(ARGS).reverse();

    it(`${tag} with invalid startTime - should fail`, async () => {
      const copy = Array.from(args);
      copy[fromCalldata ? 2 : 3] = 0;
      await assertRevert((fromCalldata ? simpleMock.createFromCalldata : simpleMock.createFromBytes)(...copy, { value: 1, gasLimit: 9_000_000 }));
    });

    it(`${tag}`, async () => {
      const tx = await (fromCalldata ? simpleMock.createFromCalldata : simpleMock.createFromBytes)(...args, { value: 1 });
      const receipt = await tx.wait();
      console.log(receipt.gasUsed.toString());
      const addr = receipt.events[0].args[0];

      childContract = simpleMock.attach(addr);

      {
        const meta = await childContract.getMetadataViaCall();
        assert.deepEqual(
          meta.map((e) => e.toString()),
          ARGS.map((e) => e.toString()),
          'metadata should equal `create` arguments'
        );
      }
      {
        const meta = await childContract.getMetadataWithoutCall();
        assert.deepEqual(
          meta.map((e) => e.toString()),
          ARGS.map((e) => e.toString()),
          'metadata should equal `create` arguments'
        );
      }

      assert.equal((await childContract.lastUpdate()).toString(), ARGS[2].toString(), 'lastUpdate should be startTime');
      assert.equal((await childContract.provider.getBalance(childContract.address)).toString(), '1', 'ether balance');
    });

    it('init second time - should fail', async () => {
      await assertRevert(childContract.init({ gasLimit: 9_000_000 }));
    });

    it('doSomething', async () => {
      const tx = await childContract.doSomething();
      const receipt = await tx.wait();
      const meta = receipt.events[0].args;

      assert.deepEqual(
        meta.map((e) => e.toString()),
        ARGS.map((e) => e.toString()),
        'metadata should equal `create` arguments'
      );
    });

    it('doSomethingTwo', async () => {
      const data = '0xcoffebabe';
      const tx = await childContract.doSomethingTwo(data);
      const receipt = await tx.wait();
      const meta = receipt.events[0].args;

      assert.deepEqual(
        meta.map((e) => e.toString()),
        ARGS.map((e) => e.toString()),
        'metadata should equal `create` arguments'
      );
      assert.equal(receipt.events[1].args.data, data);
    });

    it('doRevert', async () => {
      await assert.rejects(childContract.doRevert('c0ffebabe'), /c0ffebabe/);
    });
  }

  doRound(true);
  doRound(false);
});

// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.7.6;

import '../MetaProxyFactory.sol';

/// @notice A contract to test & demonstrate the MetaProxyFactory.
contract SimpleMock is MetaProxyFactory {
  uint256 public lastUpdate;

  event NewMockCreated(address indexed addr);
  event SomeEvent(
    address token,
    address payer,
    uint256 startTime,
    uint256 dripRateSeconds,
    address[] payees,
    uint256[] ratesPerDrip
  );
  event SomeData(string data);

  /// @notice One-time initializer.
  function init () external payable {
    require(lastUpdate == 0);
    require(msg.value > 0);

    (,,uint256 startTime,,,) = SimpleMock(this).getMetadataViaCall();
    require(startTime > 0);
    lastUpdate = startTime;
  }

  // @notice MetaProxy construction via calldata.
  function createFromCalldata (
    address /*token*/,
    address /*payer*/,
    uint256 /*startTime*/,
    uint256 /*dripRateSeconds*/,
    address[] calldata /*payees*/,
    uint256[] calldata /*ratesPerDrip*/
  ) external payable returns (address addr) {
    addr = MetaProxyFactory._metaProxyFromCalldata();
    // setup
    SimpleMock(addr).init{ value: msg.value }();
    emit NewMockCreated(addr);
  }

  /// @notice MetaProxy construction via abi encoded bytes.
  /// Arguments are reversed for testing purposes.
  function createFromBytes (
    uint256[] calldata ratesPerDrip,
    address[] calldata payees,
    uint256 dripRateSeconds,
    uint256 startTime,
    address payer,
    address token
  ) external payable returns (address addr) {
    addr = MetaProxyFactory._metaProxyFromBytes(abi.encode(token, payer, startTime, dripRateSeconds, payees, ratesPerDrip));
    // setup
    SimpleMock(addr).init{ value: msg.value }();
    emit NewMockCreated(addr);
  }

  /// @notice Returns the metadata of this (MetaProxy) contract.
  /// Only relevant with contracts created via the MetaProxy.
  /// @dev This function is aimed to to be invoked via a call.
  function getMetadataViaCall () public pure returns (
    address /*token*/,
    address /*payer*/,
    uint256 /*startTime*/,
    uint256 /*dripRateSeconds*/,
    address[] memory /*payees*/,
    uint256[] memory /*ratesPerDrip*/
  ) {
    assembly {
      let posOfMetadataSize := sub(calldatasize(), 32)
      let size := calldataload(posOfMetadataSize)
      let ptr := sub(posOfMetadataSize, size)
      calldatacopy(0, ptr, size)
      return(0, size)
    }
  }

  /// @notice Returns the metadata of this (MetaProxy) contract.
  /// Only relevant with contracts created via the MetaProxy.
  /// @dev This function is aimed to be invoked with- & without a call.
  function getMetadataWithoutCall () public pure returns (
    address /*token*/,
    address /*payer*/,
    uint256 /*startTime*/,
    uint256 /*dripRateSeconds*/,
    address[] memory /*payees*/,
    uint256[] memory /*ratesPerDrip*/
  ) {
    bytes memory data;
    assembly {
      let posOfMetadataSize := sub(calldatasize(), 32)
      let size := calldataload(posOfMetadataSize)
      let ptr := sub(posOfMetadataSize, size)
      data := mload(64)
      // increment free memory pointer by metadata size + 32 bytes (length)
      mstore(64, add(data, add(size, 32)))
      mstore(data, size)
      let memPtr := add(data, 32)
      calldatacopy(memPtr, ptr, size)
    }
    return abi.decode(data, (address, address, uint256, uint256, address[], uint256[]));
  }

  /// @notice Do something with the metadata.
  function doSomething () public {
    (
      address token,
      address payer,
      uint256 startTime,
      uint256 dripRateSeconds,
      address[] memory payees,
      uint256[] memory ratesPerDrip
    ) = getMetadataWithoutCall();

    emit SomeEvent(token, payer, startTime, dripRateSeconds, payees, ratesPerDrip);
  }

  /// @notice Do something with the metadata. Receives user supplied calldata.
  function doSomethingTwo (string memory data) public {
    (
      address token,
      address payer,
      uint256 startTime,
      uint256 dripRateSeconds,
      address[] memory payees,
      uint256[] memory ratesPerDrip
    ) = getMetadataWithoutCall();

    emit SomeEvent(token, payer, startTime, dripRateSeconds, payees, ratesPerDrip);
    emit SomeData(data);
  }

  /// @notice Revert if user supplied error message.
  function doRevert (string memory data) public {
    (address token,,,,,) = getMetadataWithoutCall();
    require(token == address(0), data);
  }
}

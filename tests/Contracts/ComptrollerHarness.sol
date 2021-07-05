pragma solidity ^0.5.16;

import "../../contracts/Comptroller.sol";
import "../../contracts/PriceOracle.sol";

contract ComptrollerKovan is Comptroller {
  function getSashimiAddress() public view returns (address) {
    return 0x61460874a7196d6a22D1eE4922473664b3E95270;
  }
}

contract ComptrollerRopsten is Comptroller {
  function getSashimiAddress() public view returns (address) {
    return 0x1Fe16De955718CFAb7A44605458AB023838C2793;
  }
}

contract ComptrollerHarness is Comptroller {
    address sashimiAddress;
    uint public blockNumber;

    constructor() Comptroller() public {}

    function setPauseGuardian(address harnessedPauseGuardian) public {
        pauseGuardian = harnessedPauseGuardian;
    }

    function setSashimiSupplyState(address slToken, uint224 index, uint32 blockNumber_) public {
        sashimiSupplyState[slToken].index = index;
        sashimiSupplyState[slToken].block = blockNumber_;
    }

    function setSashimiBorrowState(address slToken, uint224 index, uint32 blockNumber_) public {
        sashimiBorrowState[slToken].index = index;
        sashimiBorrowState[slToken].block = blockNumber_;
    }

    function setSashimiAccrued(address user, uint userAccrued) public {
        sashimiAccrued[user] = userAccrued;
    }

    function setSashimiAddress(address sashimiAddress_) public {
        sashimiAddress = sashimiAddress_;
    }

    function getSashimiAddress() public view returns (address) {
        return sashimiAddress;
    }

    function setSashimiSpeed(address slToken, uint sashimiSpeed) public {
        sashimiSpeeds[slToken] = sashimiSpeed;
    }

    function setSashimiBorrowerIndex(address slToken, address borrower, uint index) public {
        sashimiBorrowerIndex[slToken][borrower] = index;
    }

    function setSashimiSupplierIndex(address slToken, address supplier, uint index) public {
        sashimiSupplierIndex[slToken][supplier] = index;
    }

    function harnessUpdateSashimiBorrowIndex(address slToken, uint marketBorrowIndexMantissa) public {
        updateSashimiBorrowIndex(slToken, Exp({mantissa: marketBorrowIndexMantissa}));
    }

    function harnessUpdateSashimiSupplyIndex(address slToken) public {
        updateSashimiSupplyIndex(slToken);
    }

    function harnessDistributeBorrowerSashimi(address slToken, address borrower, uint marketBorrowIndexMantissa) public {
        distributeBorrowerSashimi(slToken, borrower, Exp({mantissa: marketBorrowIndexMantissa}), false);
    }

    function harnessDistributeSupplierSashimi(address slToken, address supplier) public {
        distributeSupplierSashimi(slToken, supplier, false);
    }

    function harnessTransferSashimi(address user, uint userAccrued, uint threshold) public returns (uint) {
        return transferSashimi(user, userAccrued, threshold);
    }

    function harnessFastForward(uint blocks) public returns (uint) {
        blockNumber += blocks;
        return blockNumber;
    }

    function setBlockNumber(uint number) public {
        blockNumber = number;
    }

    function getBlockNumber() public view returns (uint) {
        return blockNumber;
    }

    function getSashimiMarkets() public view returns (address[] memory) {
        uint m = allMarkets.length;
        uint n = 0;
        for (uint i = 0; i < m; i++) {
            if (markets[address(allMarkets[i])].isSashimied) {
                n++;
            }
        }

        address[] memory sashimiMarkets = new address[](n);
        uint k = 0;
        for (uint i = 0; i < m; i++) {
            if (markets[address(allMarkets[i])].isSashimied) {
                sashimiMarkets[k++] = address(allMarkets[i]);
            }
        }
        return sashimiMarkets;
    }
}

contract ComptrollerBorked {
    function _become(Unitroller unitroller, PriceOracle _oracle, uint _closeFactorMantissa, uint _maxAssets, bool _reinitializing) public {
        _oracle;
        _closeFactorMantissa;
        _maxAssets;
        _reinitializing;

        require(msg.sender == unitroller.admin(), "only unitroller admin can change brains");
        unitroller._acceptImplementation();
    }
}

contract BoolComptroller is ComptrollerInterface {
    bool allowMint = true;
    bool allowRedeem = true;
    bool allowBorrow = true;
    bool allowRepayBorrow = true;
    bool allowLiquidateBorrow = true;
    bool allowSeize = true;
    bool allowTransfer = true;

    bool verifyMint = true;
    bool verifyRedeem = true;
    bool verifyBorrow = true;
    bool verifyRepayBorrow = true;
    bool verifyLiquidateBorrow = true;
    bool verifySeize = true;
    bool verifyTransfer = true;

    bool failCalculateSeizeTokens;
    uint calculatedSeizeTokens;

    uint noError = 0;
    uint opaqueError = noError + 11; // an arbitrary, opaque error code

    /*** Assets You Are In ***/

    function enterMarkets(address[] calldata _slTokens) external returns (uint[] memory) {
        _slTokens;
        uint[] memory ret;
        return ret;
    }

    function exitMarket(address _slToken) external returns (uint) {
        _slToken;
        return noError;
    }

    /*** Policy Hooks ***/

    function mintAllowed(address _slToken, address _minter, uint _mintAmount) public returns (uint) {
        _slToken;
        _minter;
        _mintAmount;
        return allowMint ? noError : opaqueError;
    }

    function mintVerify(address _slToken, address _minter, uint _mintAmount, uint _mintTokens) external {
        _slToken;
        _minter;
        _mintAmount;
        _mintTokens;
        require(verifyMint, "mintVerify rejected mint");
    }

    function redeemAllowed(address _slToken, address _redeemer, uint _redeemTokens) public returns (uint) {
        _slToken;
        _redeemer;
        _redeemTokens;
        return allowRedeem ? noError : opaqueError;
    }

    function redeemVerify(address _slToken, address _redeemer, uint _redeemAmount, uint _redeemTokens) external {
        _slToken;
        _redeemer;
        _redeemAmount;
        _redeemTokens;
        require(verifyRedeem, "redeemVerify rejected redeem");
    }

    function borrowAllowed(address _slToken, address _borrower, uint _borrowAmount) public returns (uint) {
        _slToken;
        _borrower;
        _borrowAmount;
        return allowBorrow ? noError : opaqueError;
    }

    function borrowVerify(address _slToken, address _borrower, uint _borrowAmount) external {
        _slToken;
        _borrower;
        _borrowAmount;
        require(verifyBorrow, "borrowVerify rejected borrow");
    }

    function repayBorrowAllowed(
        address _slToken,
        address _payer,
        address _borrower,
        uint _repayAmount) public returns (uint) {
        _slToken;
        _payer;
        _borrower;
        _repayAmount;
        return allowRepayBorrow ? noError : opaqueError;
    }

    function repayBorrowVerify(
        address _slToken,
        address _payer,
        address _borrower,
        uint _repayAmount,
        uint _borrowerIndex) external {
        _slToken;
        _payer;
        _borrower;
        _repayAmount;
        _borrowerIndex;
        require(verifyRepayBorrow, "repayBorrowVerify rejected repayBorrow");
    }

    function liquidateBorrowAllowed(
        address _slTokenBorrowed,
        address _slTokenCollateral,
        address _liquidator,
        address _borrower,
        uint _repayAmount) public returns (uint) {
        _slTokenBorrowed;
        _slTokenCollateral;
        _liquidator;
        _borrower;
        _repayAmount;
        return allowLiquidateBorrow ? noError : opaqueError;
    }

    function liquidateBorrowVerify(
        address _slTokenBorrowed,
        address _slTokenCollateral,
        address _liquidator,
        address _borrower,
        uint _repayAmount,
        uint _seizeTokens) external {
        _slTokenBorrowed;
        _slTokenCollateral;
        _liquidator;
        _borrower;
        _repayAmount;
        _seizeTokens;
        require(verifyLiquidateBorrow, "liquidateBorrowVerify rejected liquidateBorrow");
    }

    function seizeAllowed(
        address _slTokenCollateral,
        address _slTokenBorrowed,
        address _borrower,
        address _liquidator,
        uint _seizeTokens) public returns (uint) {
        _slTokenCollateral;
        _slTokenBorrowed;
        _liquidator;
        _borrower;
        _seizeTokens;
        return allowSeize ? noError : opaqueError;
    }

    function seizeVerify(
        address _slTokenCollateral,
        address _slTokenBorrowed,
        address _liquidator,
        address _borrower,
        uint _seizeTokens) external {
        _slTokenCollateral;
        _slTokenBorrowed;
        _liquidator;
        _borrower;
        _seizeTokens;
        require(verifySeize, "seizeVerify rejected seize");
    }

    function transferAllowed(
        address _slToken,
        address _src,
        address _dst,
        uint _transferTokens) public returns (uint) {
        _slToken;
        _src;
        _dst;
        _transferTokens;
        return allowTransfer ? noError : opaqueError;
    }

    function transferVerify(
        address _slToken,
        address _src,
        address _dst,
        uint _transferTokens) external {
        _slToken;
        _src;
        _dst;
        _transferTokens;
        require(verifyTransfer, "transferVerify rejected transfer");
    }

    /*** Special Liquidation Calculation ***/

    function liquidateCalculateSeizeTokens(
        address _slTokenBorrowed,
        address _slTokenCollateral,
        uint _repayAmount) public view returns (uint, uint) {
        _slTokenBorrowed;
        _slTokenCollateral;
        _repayAmount;
        return failCalculateSeizeTokens ? (opaqueError, 0) : (noError, calculatedSeizeTokens);
    }

    /**** Mock Settors ****/

    /*** Policy Hooks ***/

    function setMintAllowed(bool allowMint_) public {
        allowMint = allowMint_;
    }

    function setMintVerify(bool verifyMint_) public {
        verifyMint = verifyMint_;
    }

    function setRedeemAllowed(bool allowRedeem_) public {
        allowRedeem = allowRedeem_;
    }

    function setRedeemVerify(bool verifyRedeem_) public {
        verifyRedeem = verifyRedeem_;
    }

    function setBorrowAllowed(bool allowBorrow_) public {
        allowBorrow = allowBorrow_;
    }

    function setBorrowVerify(bool verifyBorrow_) public {
        verifyBorrow = verifyBorrow_;
    }

    function setRepayBorrowAllowed(bool allowRepayBorrow_) public {
        allowRepayBorrow = allowRepayBorrow_;
    }

    function setRepayBorrowVerify(bool verifyRepayBorrow_) public {
        verifyRepayBorrow = verifyRepayBorrow_;
    }

    function setLiquidateBorrowAllowed(bool allowLiquidateBorrow_) public {
        allowLiquidateBorrow = allowLiquidateBorrow_;
    }

    function setLiquidateBorrowVerify(bool verifyLiquidateBorrow_) public {
        verifyLiquidateBorrow = verifyLiquidateBorrow_;
    }

    function setSeizeAllowed(bool allowSeize_) public {
        allowSeize = allowSeize_;
    }

    function setSeizeVerify(bool verifySeize_) public {
        verifySeize = verifySeize_;
    }

    function setTransferAllowed(bool allowTransfer_) public {
        allowTransfer = allowTransfer_;
    }

    function setTransferVerify(bool verifyTransfer_) public {
        verifyTransfer = verifyTransfer_;
    }

    /*** Liquidity/Liquidation Calculations ***/

    function setCalculatedSeizeTokens(uint seizeTokens_) public {
        calculatedSeizeTokens = seizeTokens_;
    }

    function setFailCalculateSeizeTokens(bool shouldFail) public {
        failCalculateSeizeTokens = shouldFail;
    }
}

contract EchoTypesComptroller is UnitrollerAdminStorage {
    function stringy(string memory s) public pure returns(string memory) {
        return s;
    }

    function addresses(address a) public pure returns(address) {
        return a;
    }

    function booly(bool b) public pure returns(bool) {
        return b;
    }

    function listOInts(uint[] memory u) public pure returns(uint[] memory) {
        return u;
    }

    function reverty() public pure {
        require(false, "gotcha sucka");
    }

    function becomeBrains(address payable unitroller) public {
        Unitroller(unitroller)._acceptImplementation();
    }
}

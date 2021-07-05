import {Event} from '../Event';
import {addAction, describeUser, World} from '../World';
import {decodeCall, getPastEvents} from '../Contract';
import {Comptroller} from '../Contract/Comptroller';
import {ComptrollerImpl} from '../Contract/ComptrollerImpl';
import {SLToken} from '../Contract/SLToken';
import {invoke} from '../Invokation';
import {
  getAddressV,
  getBoolV,
  getEventV,
  getExpNumberV,
  getNumberV,
  getPercentV,
  getStringV,
  getCoreValue
} from '../CoreValue';
import {
  AddressV,
  BoolV,
  EventV,
  NumberV,
  StringV
} from '../Value';
import {Arg, Command, View, processCommandEvent} from '../Command';
import {buildComptrollerImpl} from '../Builder/ComptrollerImplBuilder';
import {ComptrollerErrorReporter} from '../ErrorReporter';
import {getComptroller, getComptrollerImpl} from '../ContractLookup';
import {getLiquidity} from '../Value/ComptrollerValue';
import {getSLTokenV} from '../Value/SLTokenValue';
import {encodedNumber} from '../Encoding';
import {encodeABI, rawValues} from "../Utils";

async function genComptroller(world: World, from: string, params: Event): Promise<World> {
  let {world: nextWorld, comptrollerImpl: comptroller, comptrollerImplData: comptrollerData} = await buildComptrollerImpl(world, from, params);
  world = nextWorld;

  world = addAction(
    world,
    `Added Comptroller (${comptrollerData.description}) at address ${comptroller._address}`,
    comptrollerData.invokation
  );

  return world;
};

async function setPaused(world: World, from: string, comptroller: Comptroller, actionName: string, isPaused: boolean): Promise<World> {
  const pauseMap = {
    "Mint": comptroller.methods._setMintPaused
  };

  if (!pauseMap[actionName]) {
    throw `Cannot find pause function for action "${actionName}"`;
  }

  let invokation = await invoke(world, comptroller[actionName]([isPaused]), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Comptroller: set paused for ${actionName} to ${isPaused}`,
    invokation
  );

  return world;
}

async function setMaxAssets(world: World, from: string, comptroller: Comptroller, numberOfAssets: NumberV): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setMaxAssets(numberOfAssets.encode()), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Set max assets to ${numberOfAssets.show()}`,
    invokation
  );

  return world;
}

async function setLiquidationIncentive(world: World, from: string, comptroller: Comptroller, liquidationIncentive: NumberV): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setLiquidationIncentive(liquidationIncentive.encode()), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Set liquidation incentive to ${liquidationIncentive.show()}`,
    invokation
  );

  return world;
}

async function supportMarket(world: World, from: string, comptroller: Comptroller, slToken: SLToken): Promise<World> {
  if (world.dryRun) {
    // Skip this specifically on dry runs since it's likely to crash due to a number of reasons
    world.printer.printLine(`Dry run: Supporting market  \`${slToken._address}\``);
    return world;
  }

  let invokation = await invoke(world, comptroller.methods._supportMarket(slToken._address), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Supported market ${slToken.name}`,
    invokation
  );

  return world;
}

async function unlistMarket(world: World, from: string, comptroller: Comptroller, slToken: SLToken): Promise<World> {
  let invokation = await invoke(world, comptroller.methods.unlist(slToken._address), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Unlisted market ${slToken.name}`,
    invokation
  );

  return world;
}

async function enterMarkets(world: World, from: string, comptroller: Comptroller, assets: string[]): Promise<World> {
  let invokation = await invoke(world, comptroller.methods.enterMarkets(assets), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Called enter assets ${assets} as ${describeUser(world, from)}`,
    invokation
  );

  return world;
}

async function exitMarket(world: World, from: string, comptroller: Comptroller, asset: string): Promise<World> {
  let invokation = await invoke(world, comptroller.methods.exitMarket(asset), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Called exit market ${asset} as ${describeUser(world, from)}`,
    invokation
  );

  return world;
}

async function setPriceOracle(world: World, from: string, comptroller: Comptroller, priceOracleAddr: string): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setPriceOracle(priceOracleAddr), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Set price oracle for to ${priceOracleAddr} as ${describeUser(world, from)}`,
    invokation
  );

  return world;
}

async function setCollateralFactor(world: World, from: string, comptroller: Comptroller, slToken: SLToken, collateralFactor: NumberV): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setCollateralFactor(slToken._address, collateralFactor.encode()), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Set collateral factor for ${slToken.name} to ${collateralFactor.show()}`,
    invokation
  );

  return world;
}

async function setCloseFactor(world: World, from: string, comptroller: Comptroller, closeFactor: NumberV): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setCloseFactor(closeFactor.encode()), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Set close factor to ${closeFactor.show()}`,
    invokation
  );

  return world;
}

async function fastForward(world: World, from: string, comptroller: Comptroller, blocks: NumberV): Promise<World> {
  let invokation = await invoke(world, comptroller.methods.fastForward(blocks.encode()), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Fast forward ${blocks.show()} blocks to #${invokation.value}`,
    invokation
  );

  return world;
}

async function sendAny(world: World, from:string, comptroller: Comptroller, signature: string, callArgs: string[]): Promise<World> {
  const fnData = encodeABI(world, signature, callArgs);
  await world.web3.eth.sendTransaction({
      to: comptroller._address,
      data: fnData,
      from: from
    })
  return world;
}

async function addSashimiMarkets(world: World, from: string, comptroller: Comptroller, slTokens: SLToken[]): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._addSashimiMarkets(slTokens.map(c => c._address)), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Added SASHIMI markets ${slTokens.map(c => c.name)}`,
    invokation
  );

  return world;
}

async function dropSashimiMarket(world: World, from: string, comptroller: Comptroller, slToken: SLToken): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._dropSashimiMarket(slToken._address), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Drop SASHIMI market ${slToken.name}`,
    invokation
  );

  return world;
}

async function refreshSashimiSpeeds(world: World, from: string, comptroller: Comptroller): Promise<World> {
  let invokation = await invoke(world, comptroller.methods.refreshSashimiSpeeds(), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Refreshed SASHIMI speeds`,
    invokation
  );

  return world;
}

async function claimSashimi(world: World, from: string, comptroller: Comptroller, holder: string): Promise<World> {
  let invokation = await invoke(world, comptroller.methods.claimSashimi(holder), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Sashimi claimed by ${holder}`,
    invokation
  );

  return world;
}

async function setSashimiRate(world: World, from: string, comptroller: Comptroller, rate: NumberV): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setSashimiRate(rate.encode()), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Sashimi rate set to ${rate.show()}`,
    invokation
  );

  return world;
}

async function printLiquidity(world: World, comptroller: Comptroller): Promise<World> {
  let enterEvents = await getPastEvents(world, comptroller, 'StdComptroller', 'MarketEntered');
  let addresses = enterEvents.map((event) => event.returnValues['account']);
  let uniq = [...new Set(addresses)];

  world.printer.printLine("Liquidity:")

  const liquidityMap = await Promise.all(uniq.map(async (address) => {
    let userLiquidity = await getLiquidity(world, comptroller, address);

    return [address, userLiquidity.val];
  }));

  liquidityMap.forEach(([address, liquidity]) => {
    world.printer.printLine(`\t${world.settings.lookupAlias(address)}: ${liquidity / 1e18}e18`)
  });

  return world;
}

async function setPendingAdmin(world: World, from: string, comptroller: Comptroller, newPendingAdmin: string): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setPendingAdmin(newPendingAdmin), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Comptroller: ${describeUser(world, from)} sets pending admin to ${newPendingAdmin}`,
    invokation
  );

  return world;
}

async function acceptAdmin(world: World, from: string, comptroller: Comptroller): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._acceptAdmin(), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Comptroller: ${describeUser(world, from)} accepts admin`,
    invokation
  );

  return world;
}

async function setPauseGuardian(world: World, from: string, comptroller: Comptroller, newPauseGuardian: string): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setPauseGuardian(newPauseGuardian), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Comptroller: ${describeUser(world, from)} sets pause guardian to ${newPauseGuardian}`,
    invokation
  );

  return world;
}

async function setGuardianPaused(world: World, from: string, comptroller: Comptroller, action: string, state: boolean): Promise<World> {
  let fun;
  switch(action){
    case "Transfer":
      fun = comptroller.methods._setTransferPaused
      break;
    case "Seize":
      fun = comptroller.methods._setSeizePaused
      break;
  }
  let invokation = await invoke(world, fun(state), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Comptroller: ${describeUser(world, from)} sets ${action} paused`,
    invokation
  );

  return world;
}

async function setGuardianMarketPaused(world: World, from: string, comptroller: Comptroller, slToken: SLToken, action: string, state: boolean): Promise<World> {
  let fun;
  switch(action){
    case "Mint":
      fun = comptroller.methods._setMintPaused
      break;
    case "Borrow":
      fun = comptroller.methods._setBorrowPaused
      break;
  }
  let invokation = await invoke(world, fun(slToken._address, state), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Comptroller: ${describeUser(world, from)} sets ${action} paused`,
    invokation
  );

  return world;
}

async function setMarketBorrowCaps(world: World, from: string, comptroller: Comptroller, slTokens: SLToken[], borrowCaps: NumberV[]): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setMarketBorrowCaps(slTokens.map(c => c._address), borrowCaps.map(c => c.encode())), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Borrow caps on ${slTokens} set to ${borrowCaps}`,
    invokation
  );

  return world;
}

async function setBorrowCapGuardian(world: World, from: string, comptroller: Comptroller, newBorrowCapGuardian: string): Promise<World> {
  let invokation = await invoke(world, comptroller.methods._setBorrowCapGuardian(newBorrowCapGuardian), from, ComptrollerErrorReporter);

  world = addAction(
    world,
    `Comptroller: ${describeUser(world, from)} sets borrow cap guardian to ${newBorrowCapGuardian}`,
    invokation
  );

  return world;
}

export function comptrollerCommands() {
  return [
    new Command<{comptrollerParams: EventV}>(`
        #### Deploy

        * "Comptroller Deploy ...comptrollerParams" - Generates a new Comptroller (not as Impl)
          * E.g. "Comptroller Deploy YesNo"
      `,
      "Deploy",
      [new Arg("comptrollerParams", getEventV, {variadic: true})],
      (world, from, {comptrollerParams}) => genComptroller(world, from, comptrollerParams.val)
    ),
    new Command<{comptroller: Comptroller, action: StringV, isPaused: BoolV}>(`
        #### SetPaused

        * "Comptroller SetPaused <Action> <Bool>" - Pauses or unpaused given slToken function
          * E.g. "Comptroller SetPaused "Mint" True"
      `,
      "SetPaused",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("action", getStringV),
        new Arg("isPaused", getBoolV)
      ],
      (world, from, {comptroller, action, isPaused}) => setPaused(world, from, comptroller, action.val, isPaused.val)
    ),
    new Command<{comptroller: Comptroller, slToken: SLToken}>(`
        #### SupportMarket

        * "Comptroller SupportMarket <SLToken>" - Adds support in the Comptroller for the given slToken
          * E.g. "Comptroller SupportMarket slZRX"
      `,
      "SupportMarket",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("slToken", getSLTokenV)
      ],
      (world, from, {comptroller, slToken}) => supportMarket(world, from, comptroller, slToken)
    ),
    new Command<{comptroller: Comptroller, slToken: SLToken}>(`
        #### UnList

        * "Comptroller UnList <SLToken>" - Mock unlists a given market in tests
          * E.g. "Comptroller UnList slZRX"
      `,
      "UnList",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("slToken", getSLTokenV)
      ],
      (world, from, {comptroller, slToken}) => unlistMarket(world, from, comptroller, slToken)
    ),
    new Command<{comptroller: Comptroller, slTokens: SLToken[]}>(`
        #### EnterMarkets

        * "Comptroller EnterMarkets (<SLToken> ...)" - User enters the given markets
          * E.g. "Comptroller EnterMarkets (slZRX slETH)"
      `,
      "EnterMarkets",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("slTokens", getSLTokenV, {mapped: true})
      ],
      (world, from, {comptroller, slTokens}) => enterMarkets(world, from, comptroller, slTokens.map((c) => c._address))
    ),
    new Command<{comptroller: Comptroller, slToken: SLToken}>(`
        #### ExitMarket

        * "Comptroller ExitMarket <SLToken>" - User exits the given markets
          * E.g. "Comptroller ExitMarket slZRX"
      `,
      "ExitMarket",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("slToken", getSLTokenV)
      ],
      (world, from, {comptroller, slToken}) => exitMarket(world, from, comptroller, slToken._address)
    ),
    new Command<{comptroller: Comptroller, maxAssets: NumberV}>(`
        #### SetMaxAssets

        * "Comptroller SetMaxAssets <Number>" - Sets (or resets) the max allowed asset count
          * E.g. "Comptroller SetMaxAssets 4"
      `,
      "SetMaxAssets",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("maxAssets", getNumberV)
      ],
      (world, from, {comptroller, maxAssets}) => setMaxAssets(world, from, comptroller, maxAssets)
    ),
    new Command<{comptroller: Comptroller, liquidationIncentive: NumberV}>(`
        #### LiquidationIncentive

        * "Comptroller LiquidationIncentive <Number>" - Sets the liquidation incentive
          * E.g. "Comptroller LiquidationIncentive 1.1"
      `,
      "LiquidationIncentive",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("liquidationIncentive", getExpNumberV)
      ],
      (world, from, {comptroller, liquidationIncentive}) => setLiquidationIncentive(world, from, comptroller, liquidationIncentive)
    ),
    new Command<{comptroller: Comptroller, priceOracle: AddressV}>(`
        #### SetPriceOracle

        * "Comptroller SetPriceOracle oracle:<Address>" - Sets the price oracle address
          * E.g. "Comptroller SetPriceOracle 0x..."
      `,
      "SetPriceOracle",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("priceOracle", getAddressV)
      ],
      (world, from, {comptroller, priceOracle}) => setPriceOracle(world, from, comptroller, priceOracle.val)
    ),
    new Command<{comptroller: Comptroller, slToken: SLToken, collateralFactor: NumberV}>(`
        #### SetCollateralFactor

        * "Comptroller SetCollateralFactor <SLToken> <Number>" - Sets the collateral factor for given slToken to number
          * E.g. "Comptroller SetCollateralFactor slZRX 0.1"
      `,
      "SetCollateralFactor",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("slToken", getSLTokenV),
        new Arg("collateralFactor", getExpNumberV)
      ],
      (world, from, {comptroller, slToken, collateralFactor}) => setCollateralFactor(world, from, comptroller, slToken, collateralFactor)
    ),
    new Command<{comptroller: Comptroller, closeFactor: NumberV}>(`
        #### SetCloseFactor

        * "Comptroller SetCloseFactor <Number>" - Sets the close factor to given percentage
          * E.g. "Comptroller SetCloseFactor 0.2"
      `,
      "SetCloseFactor",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("closeFactor", getPercentV)
      ],
      (world, from, {comptroller, closeFactor}) => setCloseFactor(world, from, comptroller, closeFactor)
    ),
    new Command<{comptroller: Comptroller, newPendingAdmin: AddressV}>(`
        #### SetPendingAdmin

        * "Comptroller SetPendingAdmin newPendingAdmin:<Address>" - Sets the pending admin for the Comptroller
          * E.g. "Comptroller SetPendingAdmin Geoff"
      `,
      "SetPendingAdmin",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("newPendingAdmin", getAddressV)
      ],
      (world, from, {comptroller, newPendingAdmin}) => setPendingAdmin(world, from, comptroller, newPendingAdmin.val)
    ),
    new Command<{comptroller: Comptroller}>(`
        #### AcceptAdmin

        * "Comptroller AcceptAdmin" - Accepts admin for the Comptroller
          * E.g. "From Geoff (Comptroller AcceptAdmin)"
      `,
      "AcceptAdmin",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
      ],
      (world, from, {comptroller}) => acceptAdmin(world, from, comptroller)
    ),
    new Command<{comptroller: Comptroller, newPauseGuardian: AddressV}>(`
        #### SetPauseGuardian

        * "Comptroller SetPauseGuardian newPauseGuardian:<Address>" - Sets the PauseGuardian for the Comptroller
          * E.g. "Comptroller SetPauseGuardian Geoff"
      `,
      "SetPauseGuardian",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("newPauseGuardian", getAddressV)
      ],
      (world, from, {comptroller, newPauseGuardian}) => setPauseGuardian(world, from, comptroller, newPauseGuardian.val)
    ),

    new Command<{comptroller: Comptroller, action: StringV, isPaused: BoolV}>(`
        #### SetGuardianPaused

        * "Comptroller SetGuardianPaused <Action> <Bool>" - Pauses or unpaused given slToken function
        * E.g. "Comptroller SetGuardianPaused "Transfer" True"
        `,
        "SetGuardianPaused",
        [
          new Arg("comptroller", getComptroller, {implicit: true}),
          new Arg("action", getStringV),
          new Arg("isPaused", getBoolV)
        ],
        (world, from, {comptroller, action, isPaused}) => setGuardianPaused(world, from, comptroller, action.val, isPaused.val)
    ),

    new Command<{comptroller: Comptroller, slToken: SLToken, action: StringV, isPaused: BoolV}>(`
        #### SetGuardianMarketPaused

        * "Comptroller SetGuardianMarketPaused <SLToken> <Action> <Bool>" - Pauses or unpaused given slToken function
        * E.g. "Comptroller SetGuardianMarketPaused slREP "Mint" True"
        `,
        "SetGuardianMarketPaused",
        [
          new Arg("comptroller", getComptroller, {implicit: true}),
          new Arg("slToken", getSLTokenV),
          new Arg("action", getStringV),
          new Arg("isPaused", getBoolV)
        ],
        (world, from, {comptroller, slToken, action, isPaused}) => setGuardianMarketPaused(world, from, comptroller, slToken, action.val, isPaused.val)
    ),

    new Command<{comptroller: Comptroller, blocks: NumberV, _keyword: StringV}>(`
        #### FastForward

        * "FastForward n:<Number> Blocks" - Moves the block number forward "n" blocks. Note: in "SLTokenScenario" and "ComptrollerScenario" the current block number is mocked (starting at 100000). This is the only way for the protocol to see a higher block number (for accruing interest).
          * E.g. "Comptroller FastForward 5 Blocks" - Move block number forward 5 blocks.
      `,
      "FastForward",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("blocks", getNumberV),
        new Arg("_keyword", getStringV)
      ],
      (world, from, {comptroller, blocks}) => fastForward(world, from, comptroller, blocks)
    ),
    new View<{comptroller: Comptroller}>(`
        #### Liquidity

        * "Comptroller Liquidity" - Prints liquidity of all minters or borrowers
      `,
      "Liquidity",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
      ],
      (world, {comptroller}) => printLiquidity(world, comptroller)
    ),
    new View<{comptroller: Comptroller, input: StringV}>(`
        #### Decode

        * "Decode input:<String>" - Prints information about a call to a Comptroller contract
      `,
      "Decode",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("input", getStringV)

      ],
      (world, {comptroller, input}) => decodeCall(world, comptroller, input.val)
    ),

    new Command<{comptroller: Comptroller, signature: StringV, callArgs: StringV[]}>(`
      #### Send
      * Comptroller Send functionSignature:<String> callArgs[] - Sends any transaction to comptroller
      * E.g: Comptroller Send "setSashimiAddress(address)" (Address SASHIMI)
      `,
      "Send",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("signature", getStringV),
        new Arg("callArgs", getCoreValue, {variadic: true, mapped: true})
      ],
      (world, from, {comptroller, signature, callArgs}) => sendAny(world, from, comptroller, signature.val, rawValues(callArgs))
    ),
    new Command<{comptroller: Comptroller, slTokens: SLToken[]}>(`
      #### AddSashimiMarkets

      * "Comptroller AddSashimiMarkets (<Address> ...)" - Makes a market SASHIMI-enabled
      * E.g. "Comptroller AddSashimiMarkets (slZRX cBAT)
      `,
      "AddSashimiMarkets",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("slTokens", getSLTokenV, {mapped: true})
      ],
      (world, from, {comptroller, slTokens}) => addSashimiMarkets(world, from, comptroller, slTokens)
     ),
    new Command<{comptroller: Comptroller, slToken: SLToken}>(`
      #### DropSashimiMarket

      * "Comptroller DropSashimiMarket <Address>" - Makes a market SASHIMI
      * E.g. "Comptroller DropSashimiMarket slZRX
      `,
      "DropSashimiMarket",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("slToken", getSLTokenV)
      ],
      (world, from, {comptroller, slToken}) => dropSashimiMarket(world, from, comptroller, slToken)
     ),

    new Command<{comptroller: Comptroller}>(`
      #### RefreshSashimiSpeeds

      * "Comptroller RefreshSashimiSpeeds" - Recalculates all the SASHIMI market speeds
      * E.g. "Comptroller RefreshSashimiSpeeds
      `,
      "RefreshSashimiSpeeds",
      [
        new Arg("comptroller", getComptroller, {implicit: true})
      ],
      (world, from, {comptroller}) => refreshSashimiSpeeds(world, from, comptroller)
    ),
    new Command<{comptroller: Comptroller, holder: AddressV}>(`
      #### ClaimSashimi

      * "Comptroller ClaimSashimi <holder>" - Claims sashimi
      * E.g. "Comptroller ClaimSashimi Geoff
      `,
      "ClaimSashimi",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("holder", getAddressV)
      ],
      (world, from, {comptroller, holder}) => claimSashimi(world, from, comptroller, holder.val)
    ),
    new Command<{comptroller: Comptroller, rate: NumberV}>(`
      #### SetSashimiRate

      * "Comptroller SetSashimiRate <rate>" - Sets SASHIMI rate
      * E.g. "Comptroller SetSashimiRate 1e18
      `,
      "SetSashimiRate",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("rate", getNumberV)
      ],
      (world, from, {comptroller, rate}) => setSashimiRate(world, from, comptroller, rate)
    ),
    new Command<{comptroller: Comptroller, slTokens: SLToken[], borrowCaps: NumberV[]}>(`
      #### SetMarketBorrowCaps

      * "Comptroller SetMarketBorrowCaps (<SLToken> ...) (<borrowCap> ...)" - Sets Market Borrow Caps
      * E.g "Comptroller SetMarketBorrowCaps (slZRX slUSDC) (10000.0e18, 1000.0e6)
      `,
      "SetMarketBorrowCaps",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("slTokens", getSLTokenV, {mapped: true}),
        new Arg("borrowCaps", getNumberV, {mapped: true})
      ],
      (world, from, {comptroller,slTokens,borrowCaps}) => setMarketBorrowCaps(world, from, comptroller, slTokens, borrowCaps)
    ),
    new Command<{comptroller: Comptroller, newBorrowCapGuardian: AddressV}>(`
        #### SetBorrowCapGuardian

        * "Comptroller SetBorrowCapGuardian newBorrowCapGuardian:<Address>" - Sets the Borrow Cap Guardian for the Comptroller
          * E.g. "Comptroller SetBorrowCapGuardian Geoff"
      `,
      "SetBorrowCapGuardian",
      [
        new Arg("comptroller", getComptroller, {implicit: true}),
        new Arg("newBorrowCapGuardian", getAddressV)
      ],
      (world, from, {comptroller, newBorrowCapGuardian}) => setBorrowCapGuardian(world, from, comptroller, newBorrowCapGuardian.val)
    )
  ];
}

export async function processComptrollerEvent(world: World, event: Event, from: string | null): Promise<World> {
  return await processCommandEvent<any>("Comptroller", comptrollerCommands(), world, event, from);
}

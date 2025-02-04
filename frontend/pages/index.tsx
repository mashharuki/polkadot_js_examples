import { ApiPromise, WsProvider } from "@polkadot/api";
import { Abi, CodePromise, ContractPromise } from "@polkadot/api-contract";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { numberToHex } from '@polkadot/util';
import { useEffect, useState } from "react";
import contract_file from "../flipper.contract.json";
import abi from "../metadata.json";

/**
 * Home Component
 * @returns 
 */
const Home = () => {
  const [block, setBlock] = useState(0);
  const [lastBlockHash, setLastBlockHash] = useState("");
  const [blockchainUrl, setBlockchainUrl] = useState("ws://127.0.0.1:9944");
  const [api, setApi] = useState<any>();
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [actingAddress, setActingAddress] = useState("");
  const [result, setResult] = useState("");
  const [gasConsumed, setGasConsumed] = useState("");
  const [outcome, setOutcome] = useState("");
  const [contractAddress, setContractAddress] = useState("");

  const gasLimitValue = 100000 * 1000000;
  const gasLimit_1 = numberToHex(21000);
  const storageDepositLimit = null;

  /**
   * extensionSetup function
   * @returns 
   */
  const extensionSetup = async () => {
    const { web3Accounts, web3Enable } = await import(
      "@polkadot/extension-dapp"
    );

    const extensions = await web3Enable("Polk4NET");
    if (extensions.length === 0) {
      return;
    }
    // get accounts
    const account = await web3Accounts();
    setAccounts(account);
  };

  /**
   * setup function
   */
  const setup = async () => {
    const wsProvider = new WsProvider(blockchainUrl);
    // create ApiPromise Object 
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.rpc.chain.subscribeNewHeads((lastHeader) => {
      setBlock(lastHeader.number.toNumber());
      setLastBlockHash(lastHeader.hash.toString());
    });
    setApi(api);
    // call extensionSetup
    await extensionSetup();
  };

  /**
   * deployContract function
   */
  const deployContract = async () => {
    const { web3FromSource } = await import("@polkadot/extension-dapp");
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    // setApi(api);
    const contractWasm = contract_file.source.wasm;
    const code = new CodePromise(api, abi, contractWasm);
    const initValue = false;
    const performingAccount = accounts[0];
    const injector = await web3FromSource(performingAccount.meta.source);
    
    console.log("### pass 1");
    // create
    const tx = code.tx.new({ value:0, gasLimit:gasLimitValue , storageDepositLimit }, 
      initValue,
      performingAccount.address
    );

    console.log("### pass 2");

    let address = "";
    // sign & send tx
    const unsub = await tx.signAndSend(
      actingAddress,
      { signer: injector.signer },
      ({  contract , status, events = [] }) => {
        if (status.isInBlock) {
          console.log("### in block : contract:",contract);
          setResult("in a block");
        } else if (status.isFinalized) {
          events.forEach(({ event: { data } }) => {
            console.log("### data.methhod:", data.method);
            if (String(data.method) == "ExtrinsicFailed") {
              console.log("### check ExtrinsicFailed");
              alert("Transaction Failed.");
            }
          });
          console.log("### finalized : contract:",contract);
          setResult("finalized");
          address = contract.address.toString();
          setContractAddress(address);
          //api.disconnect();
          unsub();
        }
      }
    );
  };

  /**
   * getFlipValueOnlyOwner function
   */
  const getFlipValueOnlyOwner = async () => {
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    const contract = new ContractPromise(api, abi, contractAddress);
    //setApi(api);

    // call getOnlyOwner function
    const { gasConsumed, result, output } = await contract.query.getOnlyOwner(
      actingAddress,
      { value: 0, gasLimit: -1 }
    );
    setGasConsumed(gasConsumed.toHuman());
    setResult(JSON.stringify(result.toHuman()));
    
    if (output !== undefined && output !== null) {
      setOutcome(output.toHuman()?.toString() ?? "");
    }
    //api.disconnect();
  };

  /**
   * getFlipValue function
   */
  const getFlipValue = async () => {
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    const contract = new ContractPromise(api, abi, contractAddress);
    //setApi(api);

    // call get function
    const { gasConsumed, result, output } = await contract.query.get(
      actingAddress,
      { value: 0, gasLimit: -1 }
    );
    setGasConsumed(gasConsumed.toHuman());
    setResult(JSON.stringify(result.toHuman()));
    if (output !== undefined && output !== null) {
      setOutcome(output.toHuman()?.toString() ?? "");
    }
    //api.disconnect();
  };

  /**
   * changeFlipValue function
   */
  const changeFlipValue = async () => {
    const { web3FromSource } = await import("@polkadot/extension-dapp");
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    // setApi(api);

    const contract = new ContractPromise(api, abi, contractAddress);
    const performingAccount = accounts[0];
    const injector = await web3FromSource(performingAccount.meta.source);

    // call flip function 
    const { gasRequired, result, output } = await contract.query.flip(
      actingAddress,
      { value: 0, gasLimit: -1 }
    );

    console.log("### gasRequired:",gasRequired.toHuman().toString());
    // create tx 
    const flip = await contract.tx.flip({ value: 0, gasLimit: gasRequired });

    if (injector !== undefined) {
      // sign & tx
      const unsub = await flip.signAndSend(
        actingAddress, 
        { 
          signer: injector.signer 
        }, ( { 
          status, 
          events = [] 
        } ) => {
          if (status.isInBlock) {
            setResult("in a block");
          } else if (status.isFinalized) {
            setResult("finalized");
            events.forEach(({ event: { data } }) => {
              console.log("### data.methhod:", data.method);
              if (String(data.method) == "ExtrinsicFailed") {
                console.log("### check ExtrinsicFailed");
                alert("Transaction Failed.");
              }
            });
            unsub();
            //api.disconnect();
          }
      });
    }
  };

  /**
   * add_test_data function
   */
  const add_test_data = async () => {
    const { web3FromSource } = await import("@polkadot/extension-dapp");
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    // setApi(api);

    const contract = new ContractPromise(api, abi, contractAddress);
    const performingAccount = accounts[0];
    const injector = await web3FromSource(performingAccount.meta.source);

    // create tx
    const flip = await contract.tx.addTestData(
      { value: 0, gasLimit: gasLimitValue },
      actingAddress,
      0
    );
    
    if (injector !== undefined) {
      // sign & tx
      const unsub = await flip.signAndSend(actingAddress, { signer: injector.signer }, ( { status, events = [] }) => {
        if (status.isInBlock) {
          setResult("in a block");
        } else if (status.isFinalized) {
          setResult("finalized");
          events.forEach(({ event: { data } }) => {
            console.log("### data.methhod:", data.method);
            if (String(data.method) == "ExtrinsicFailed") {
              console.log("### check ExtrinsicFailed");
              alert("Transaction Failed.");
            }
          });

          unsub();
          //api.disconnect();
        }
      });
    }
  };

  /**
   * own_error_test function
   */
  const own_error_test = async () => {
    const { web3FromSource } = await import("@polkadot/extension-dapp");
    // const wsProvider = new WsProvider(blockchainUrl);
    // const api = await ApiPromise.create({ provider: wsProvider });
    // setApi(api);

    const contract = new ContractPromise(api, abi, contractAddress);
    const performingAccount = accounts[0];
    const injector = await web3FromSource(performingAccount.meta.source);

    // call ownErrorTest function
    const flip = await contract.tx.ownErrorTest(
      { value: 0, gasLimit: gasLimitValue },
      actingAddress,
      0
    );
    
    if (injector !== undefined) {
      const unsub = await flip.signAndSend(actingAddress, { signer: injector.signer }, ({ events = [], status } ) => {
        if (status.isInBlock) {
          setResult("in a block");
        } else if (status.isFinalized) {
          setResult("finalized");
          events.forEach(({ event}) => {
            if (api.events.contracts.ContractEmitted.is(event)) {
              console.log("### event.data:",event.data);
              const [account_id, contract_evt] = event.data;
              const decoded = new Abi(abi).decodeEvent(contract_evt);
              console.log("### decoded:", decoded);
              console.log("### decoded.args[2]:",decoded.args[2].toHuman()?.toString());
            }
            console.log("### data.methhod:",event.data.method);
            if (event.data.method == "ExtrinsicFailed"){
              alert("Transaction is failure.");
            }
          });
          unsub();
          //api.disconnect();
        }
        //console.log("###result: ",status);
      });
    }
  };

  /**
   * get_test_data function
   */
  const get_test_data = async () => {
    const contract = new ContractPromise(api, abi, contractAddress);

    // call getTestList 
    const { gasConsumed, result, output } = await contract.query.getTestList(
      actingAddress,
      { value: 0, gasLimit: -1 },
      0
    );
    setGasConsumed(gasConsumed.toHuman());
    setResult(JSON.stringify(result.toHuman()));
    
    if (output !== undefined && output !== null) {
      const response_json = output.toJSON();
      const json_data = JSON.parse(JSON.stringify(response_json));
      let result: string = "";
      console.log("response_json:", response_json);
      console.log("json_data:", json_data);
      console.log("json_data length:", json_data.length);

      console.log("# pass 1");

      for (let i = 0; i < json_data.length; i++) {
        console.log("# pass 2");
        let tmp = json_data[i].tokenAddress;
        console.log("tmp:", tmp);
        result = result + tmp + ",";
        let tmp2 = json_data[i].tokenType;
        console.log("tmp2:", tmp2);
        result = result + tmp2 + ",";
      }

      console.log("result:", result);
      const result2 = result;
      setOutcome(result2);
    }
  };

  useEffect(() => {
    setup();
    //subscribeAccount();
  });

  return (
    <>
      <div className="text-center">
        <div className="p-3 m-3 text-3xl">flipper test</div>
        <div className="p-3 m-3">Block: {block}</div>
        <div className="p-3 m-3">Blockchain URL: {blockchainUrl}</div>
        <div className="">Custom Blockchain URL</div>
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          onClick={setup}
        >
          Change Blockchain URL
        </button>
        <input
          className="p-2 m-2 border-2"
          onChange={(event) => setBlockchainUrl(event.target.value)}
        />
        <br />
        <div className="p-3 m-3">Last block hash: {lastBlockHash}</div>
        <div className="p-5"></div>
        <div className="">
          Acting account (select from dropdown):{" "}
          {actingAddress ? actingAddress : "..."}
        </div>
        <br />
        <select
          className="p-3 m-3 border-2 border-green-500"
          onChange={(event) => {
            console.log(event);
            setActingAddress(event.target.value);
          }}
        >
          {accounts.map((a) => (
            <option key={a.address} value={a.address}>
              {a.address} [{a.meta.name}]
            </option>
          ))}
        </select>
        <br />
        <div className="p-3 m-3">
          <button
            className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
            onClick={deployContract}
          >
            deploy flipper contract
          </button>
          <label> contract address is : {contractAddress}</label>
        </div>
        {/* <div className="p-3 m-3">
          Input contract address (from your canvas UI after you instantiate it):{" "}
          {contractAddress}
        </div>
        <input
          className="p-2 m-2 border-2"
          onChange={(event) => setContractAddress(event.target.value)}
        /> */}
        <br />
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={getFlipValue}
        >
          {api && contractAddress
            ? "Get flip value!"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={getFlipValueOnlyOwner}
        >
          {api && contractAddress
            ? "Get flip value! (Only Owner)"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={get_test_data}
        >
          {api && contractAddress
            ? "Get test value!"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={changeFlipValue}
        >
          {api && contractAddress
            ? "Change flip value!"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={add_test_data}
        >
          {api && contractAddress
            ? "add test value!"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <button
          className="bg-green-900 hover:bg-green-800 text-white rounded px-4 py-2"
          disabled={!api || !contractAddress}
          onClick={own_error_test}
        >
          {api && contractAddress
            ? "own error test"
            : "Couldn't load API or contract address is invalid, please see logs in console."}
        </button>
        <br />
        <br />
        <div>Result: {result}</div>
        <div>Outcome: {outcome}</div>
        <div>Gas consumed: {gasConsumed}</div>
      </div>
    </>
  );
};

export default Home;

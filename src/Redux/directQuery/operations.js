import {Creators} from './actions';

const doSearch = block => async (dispatch,getState) => {
  dispatch(Creators.startSearch());

  let web3 = getState().chain.web3;
  let selCon = getState().contract.selected;
  let con = new web3.eth.Contract(selCon.abi, selCon.address,{address: selCon.address});
  let config = {
    fromBlock: block,
    toBlock: block
  }
  try {
    let events = await con.getPastEvents("allEvents", config);
    dispatch(Creators.searchSuccess(events));
  } catch (e) {
    console.log("Problem searching for events in specific block", e);
    dispatch(Creators.failure(e));
  }

}

export default {
  doSearch
}

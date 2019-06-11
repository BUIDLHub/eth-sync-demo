import {Creators} from './actions';
import {default as chainOps} from 'Redux/chain/operations';
import {default as conOps} from 'Redux/contract/operations';
import {default as runOps} from 'Redux/speedTest/runs/operations';
import {default as directOps} from 'Redux/directQuery/operations';

const initChain = props => {
  return props.dispatch(chainOps.init())
        .then(()=>props);
}

const initContracts = props => {
  return props.dispatch(conOps.init())
        .then(()=>props);
}

const initRuns = props => {
  return props.dispatch(runOps.init())
        .then(()=>props);
}

const testSearch = props => {
  return props.dispatch(directOps.doSearch(7900867))
  .then(()=>props);
}

const start = () => (dispatch,getState) => {
  let state = getState();
  if(state.init.initComplete) {
    return;
  }

  return dispatch(_doStart());
}

const _doStart = () => (dispatch,getState) => {
  dispatch(Creators.initStart());
  let props = {
    dispatch,
    getState
  }
  initChain(props)
  .then(initContracts)
  .then(initRuns)
  .then(testSearch)
  .then(()=>{
    dispatch(Creators.initSuccess());
  });
}

const unload  = () => (dispatch,getState) => {

}

export default {
  start,
  unload
}

import {createReducer} from 'reduxsauce';
import {Types} from './actions';

const INIT = {
  searching: false,
  error: null,
  result: null
}

const start = (state=INIT) => {
  return {
    ...state,
    searching: true,
    error: null
  }
}

const success = (state=INIT, action) => {
  return {
    ...state,
    searching: false,
    result: action.result
  }
}

const fail = (state=INIT, action) => {
  return {
    ...state,
    searching: false,
    error: action.error
  }
}

const HANDLERS = {
  [Types.START_SEARCH]: start,
  [Types.SEARCH_SUCCESS]: success,
  [Types.FAILURE]: fail
}

export default createReducer(INIT, HANDLERS);

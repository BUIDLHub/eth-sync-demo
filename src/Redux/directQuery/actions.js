import {createActions} from 'reduxsauce';

const {Types, Creators} = createActions({
  startSearch: null,
  searchSuccess: ['result'],
  failure: ['error']
},{prefix: "directQuery."});
export {
  Types,
  Creators
}

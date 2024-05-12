export interface GlobalData {
  openid?: string;
  notice?: {
    text?: string;
    copy?: {
      content?: string;
      message?: string;
    };
  };
}

const globalData: GlobalData = {};

export const getGlobalData = (key: keyof GlobalData) => globalData[key];

export const setGlobalData = (key: keyof GlobalData, val) => {
  globalData[key] = val;
};

export enum Plan {
  Free = 0,
  Pro = 1,
}

export interface GlobalData {
  openid?: string;
  notice?: {
    text?: string;
    copy?: {
      content?: string;
      message?: string;
    };
  };
  banners?: {
    img: string;
    link?: string;
  }[];
  plan?: Plan;
}

const globalData: GlobalData = {};

export const getGlobalData = (key: keyof GlobalData) => globalData[key];

export const setGlobalData = (key: keyof GlobalData, val) => {
  globalData[key] = val;
};

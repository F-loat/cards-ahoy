export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/detail/index',
    'pages/group/index',
    'pages/group/detail',
  ],
  window: {
    backgroundTextStyle: '@bgTxtStyle',
    navigationBarBackgroundColor: '@navBgColor',
    navigationBarTitleText: 'Cards Ahoy!',
    navigationBarTextStyle: '@navTxtStyle',
  },
  darkmode: true,
  themeLocation: 'theme.json',
  lazyCodeLoading: 'requiredComponents',
});

import {Config, Runner} from 'protractor';
import * as q from 'q';

import {ConfigParser} from 'protractor/built/configParser';
import {Plugins} from 'protractor/built/plugins';
import {Session} from 'selenium-webdriver';
import {KeywordLibrary, RemoteServerOptions, RobotKeyword, Server} from 'robotremote';

let server: Server;
let runner: Runner;

// load protractor config
const configParser: ConfigParser = new ConfigParser();
configParser.addFileConfig('protractor.conf.js');
const config: Config = configParser.getConfig();

const stopRemoteServer: RobotKeyword = () => {
  if (server) {
    return server.stopRemoteServer();
  }
};

const startProtractor: RobotKeyword = () => {
  runner = new Runner(config);

  // TODO This code was copied from the Protractor launcher script. Find a more elegant way to do this.
  q(runner.ready_)
    .then(() => {
      // 1) Setup environment
      // noinspection JSValidateTypes
      return runner.driverprovider_.setupEnv();
    })
    .then(() => {
      // 2) Create a browser and setup globals
      const browser_ = runner.createBrowser(new Plugins(config));
      runner.setupGlobals_(browser_);
      return browser_.ready.then(browser_.getSession)
        .then(
          (session: Session) => {
            // logger.debug(
            //   'WebDriver session successfully started with capabilities ' +
            //   util.inspect(session.getCapabilities()));
          },
          (err: Error) => {
            // logger.error('Unable to start a WebDriver session.');
            throw err;
          });
    });
};

const stopProtractor: RobotKeyword = () => {
  if (runner) {
    runner.shutdown_();
  }
};

export const serverLib: KeywordLibrary = {
  stopRemoteServer,
  startProtractor,
  stopProtractor
};

export function runProtractorRobotServer(libraries: KeywordLibrary[],
                                       options: RemoteServerOptions = { host: 'localhost', port: 8270, allowStop: true }) {
  server = new Server([serverLib, ...libraries], options);
}

export function keyword(fn: (...params: any[]) => any, doc?: string, args?: string[], tags?: string[]): RobotKeyword {
  const keyword: RobotKeyword = fn;
  keyword.doc = doc;
  keyword.args = args;
  keyword.tags = tags;
  return keyword;
}

import { Injectable, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { Base64 } from 'js-base64';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Injectable()
export class SocketService {
  public subject = new Subject<any>();
  public ready = false;
  public userid: string;
  public uuid: string;
  public key: string;
  namespace: string;
  serverUrl: string;
  connectPath: string;
  logicPath: string;
  platform: string;
  option: any;
  private socket: any;
  private auth: string;
  private listeners: { [propName: string]: Function[] } = {};
  private keySeparator = '$$';



  constructor(private http: HttpClient) { }

  connect({ serverUrl, connectPath, logicPath, secret, namespace, userid, uuid, platform = 'web', option = {} },
    success?: Function,
    error?: Function) {
    if (success) {
      this.addEventListener('connect', success);
    }

    if (error) {
      this.addEventListener('connect_error connect_timeout reconnect_failed', error);
    }

    if (this.socket) {
      this.disconnect();
    }

    this.namespace = namespace;
    this.auth = Base64.encode(namespace + ':' + secret);
    this.serverUrl = serverUrl;
    this.userid = userid;
    this.uuid = uuid;
    this.platform = platform;
    this.option = option;
    this.connectPath = connectPath;
    this.logicPath = logicPath;
    this.key = this.userid + this.keySeparator + this.uuid;

    if (!window.io) {
      window.LazyLoad.js(serverUrl + connectPath + '/socket.io/socket.io.js', this.initConnect, null, this);
    } else {
      this.initConnect();
    }
  }

  push(data: { room: string, pushData: any }): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: this.auth
    });

    return this.http.post(this.serverUrl + this.logicPath + '/api/auth/push', data, { headers });
  }

  disconnect() {
    this.ready = false;
    if (!this.socket) {
      return;
    }

    try {
      this.socket.disconnect();
    } catch (e) {
      console.log('断开连接失败');
    } finally {
      this.socket = undefined;
    }
  }

  joinRoom(rooms: string[], callback?) {
    this.socket.emit('joinRoom', rooms, callback);
  }

  leaveRoom(rooms: string[], callback?) {
    this.socket.emit('leaveRoom', rooms, callback);
  }

  getInfo(callback?) {
    this.socket.emit('info', {}, callback);
  }

  setInfo(data, callback?) {
    this.socket.emit('info', data, callback);
  }

  parseUserId(key) {
    return key.split(this.keySeparator)[0];
  }

  private initConnect() {
    const url = this.serverUrl + this.namespace + '?userid=' + this.userid + '&uuid=' + this.uuid + '&platform=' + this.platform;
    this.socket = window.io.connect(url, this.option);
    this.initListener();
  }

  private initListener() {
    this.socket.on('connect', () => {
      this.ready = true;
      this.emit('connect');
      this.subject.next({
        type: 'connect'
      });
      console.log('连接成功');
    });

    this.socket.on('ok', (data) => {
      this.subject.next({
        type: 'ok',
        data: data
      });
      console.dir(data);
      console.log('连接就绪:');
    });

    this.socket.on('push', (data) => {
      this.subject.next({
        type: 'push',
        data: data
      });
    });

    this.socket.on('connect_error', (e) => {
      this.emit('connect_error');
      this.subject.next({
        type: 'connect_error',
        data: e
      });
      this.disconnect();
      console.log('连接异常，请检查你的网络');
    });

    this.socket.on('connect_timeout', () => {
      this.emit('connect_timeout');
      this.subject.next({
        type: 'connect_timeout'
      });
      this.disconnect();
      console.log('连接超时，请重试');
    });

    this.socket.on('reconnect_failed', (e) => {
      this.emit('reconnect_failed');
      this.subject.next({
        type: 'reconnect_failed',
        data: e
      });
      this.disconnect();
      console.log('重新连接失败');
    });

    this.socket.on('reconnect', () => {
      this.subject.next({
        type: 'reconnect'
      });
      console.log('重新连接成功');
    });

    this.socket.on('peopleJoin', (data) => {
      this.subject.next({
        type: 'peopleJoin',
        data: data
      });
      console.dir(data);
      console.log('上线广播：');
    });

    this.socket.on('peopleLeave', (data) => {
      this.subject.next({
        type: 'peopleLeave',
        data: data
      });
      console.dir(data);
      console.log('下线广播：');
    });
  }

  private addEventListener(name: string, callback: Function) {
    const names = name.split(/\s+/);
    names.forEach((n) => {
      if (!this.listeners[n]) {
        this.listeners[n] = [];
      } else if (this.listeners[n].includes(callback)) {
        return;
      }

      this.listeners[n].push(callback);
    });
  }

  private removeEventListener(name: string, callback?: Function) {
    const names = name.split(/\s+/);
    names.forEach((n) => {
      if (callback) {
        if (this.listeners[n] && this.listeners[n].includes(callback)) {
          this.listeners[n].splice(this.listeners[n].indexOf(callback), 1);
        }
      } else {
        this.listeners[n] = [];
      }
    });
  }

  private emit(name: string) {
    if (this.listeners[name]) {
      this.listeners[name].forEach((c) => {
        c();
      });
    }
  }
}

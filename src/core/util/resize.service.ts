import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResizeService {

  static get onResize$(): Observable<Window> {
    return this.resizeSubject.asObservable();
  }

  public static resizeSubject: Subject<Window> = new Subject();

  constructor() {}

  public static publishResizeEvent(event: UIEvent) {
    console.log("publishResizeEvent");
    ResizeService.resizeSubject.next(<Window>event.target);
  }

  public static publishFullscreenchangeEvent(event: UIEvent) {
    console.log("publishFullscreenchangeEvent I should probably do something with this :/ ");
  }

}

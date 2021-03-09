import { Component, ViewChild, Renderer, ElementRef } from '@angular/core';
import { NavController, Platform, IonContent  } from '@ionic/angular';
import { File, IWriteOptions } from '@ionic-native/file/ngx';
import { Storage } from '@ionic/storage';
import {WebView} from '@ionic-native/ionic-webview/ngx';

const STORAGE_KEY = 'IMAGE_LIST';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild('imageCanvas', { static: false }) canvas: ElementRef;
  canvasElement: any;
  private position: DOMRect;
  private ctx: CanvasRenderingContext2D;

  saveX: number;
  saveY: number;

  storedImages = [];

  // Make Canvas sticky at the top stuff
  @ViewChild(IonContent, { static: false }) content: IonContent;
  @ViewChild('fixedContainer', { static: false }) fixedContainer: any;

  // Color Stuff
  selectedColor = '#9e2956';

  colors = [ '#9e2956', '#c2281d', '#de722f', '#edbf4c', '#5db37e', '#459cde', '#4250ad', '#802fa3' ];


  constructor(public navCtrl: NavController, public renderer: Renderer,
              private plt: Platform, private file: File,
              private storage: Storage, private webview: WebView) {
  }

  async ionViewDidEnter() {
    // https://github.com/ionic-team/ionic/issues/9071#issuecomment-362920591
    // Get the height of the fixed item
    let itemHeight = this.fixedContainer.nativeElement.offsetHeight;
    let scroll = this.content.getScrollElement();

    // Add preexisting scroll margin to fixed container size
    itemHeight = Number.parseFloat((await scroll).style.marginTop.replace('px', '')) + itemHeight;
    (await scroll).style.marginTop = itemHeight + 'px';

    this.position = this.canvas.nativeElement.getBoundingClientRect();
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.canvasElement = this.canvas.nativeElement;
  }

  ionViewDidLoad() {
    // Set the Canvas Element and its size

    this.canvasElement.width = this.plt.width() + '';
    this.canvasElement.height = 200;
  }

  selectColor(color) {
    this.selectedColor = color;
  }

  startDrawing(ev: any) {
    this.saveX = ev.touches[0].pageX - this.position.x;
    this.saveY = ev.touches[0].pageY - this.position.y;
  }

  moved(ev: any) {

    let ctx = this.ctx;
    let currentX = ev.touches[0].pageX - this.position.x;
    let currentY = ev.touches[0].pageY - this.position.y;

    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.selectedColor;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(this.saveX, this.saveY);
    ctx.lineTo(currentX, currentY);
    ctx.closePath();

    ctx.stroke();

    this.saveX = currentX;
    this.saveY = currentY;
  }

  clear() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }


  saveCanvasImage() {
    var dataUrl = this.canvasElement.toDataURL();

    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas

    let name = new Date().getTime() + '.png';
    let path = this.file.dataDirectory;
    let options: IWriteOptions = { replace: true };

    var data = dataUrl.split(',')[1];
    let blob = this.b64toBlob(data, 'image/png');
    debugger;
    this.file.writeFile(path, name, blob, options).then(res => {
      this.storeImage(name);
    }, err => {
      console.log('error: ', err);
    });
  }

  // https://forum.ionicframework.com/t/save-base64-encoded-image-to-specific-filepath/96180/3
  b64toBlob(b64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  storeImage(imageName) {
    let saveObj = { img: imageName };
    this.storedImages.push(saveObj);
    this.storage.set(STORAGE_KEY, this.storedImages).then(() => {
      setTimeout(() =>  {
        this.content.scrollToBottom();
      }, 500);
    });
  }

  removeImageAtIndex(index) {
    let removed = this.storedImages.splice(index, 1);
    this.file.removeFile(this.file.dataDirectory, removed[0].img).then(res => {
    }, err => {
      console.log('remove err; ' , err);
    });
    this.storage.set(STORAGE_KEY, this.storedImages);
  }

  getImagePath(imageName) {
    let path = this.file.dataDirectory + imageName;
    path = this.webview.convertFileSrc(path);
    return path;
  }

}
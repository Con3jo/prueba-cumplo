import {Component, OnInit} from '@angular/core';
import 'rxjs/Rx';
import {Observable, throwError} from "rxjs";
import {HttpParams, HttpClient, HttpErrorResponse} from "@angular/common/http";
import * as Chart from 'node_modules/chart.js/dist/Chart.js';

import * as _ from 'lodash';
import {NgbCalendar} from '@ng-bootstrap/ng-bootstrap';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';


import * as TMC from '../assets/tmc.json';



interface Currency {
    Fecha: string;
    Valor:string;
}

//Estos los nombres los pude para que correspondieran con el json que envia la SBIF
interface UFs{
    UFs: Currency[];
}

interface USDs{
    Dolares: Currency[];
}
interface TMC {
  Titulo: string;
  SubTitulo: string;
  Valor: string;
  Fecha: string;
  Tipo: string;
}

interface TMCs{
  TMCs: TMC[];
}
const params = new HttpParams()
    .set('apikey', 'f6c5ce74360b06e431f52145b91731f13f7f901f')
    .set('formato', "json");

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit {
    faMoneyBillWave = faMoneyBillWave;
    ufValuesObs: Observable<UFs>;
    ufValues: any;
    ufChartInfo: Object;
    ufMax: number;
    ufMin: number;
    ufAvg: number;

    usdValuesObs: Observable<USDs>;
    usdValues: any;
    usdChartInfo: Object;
    usdMax: number;
    usdMin: number;
    usdAvg: number;


    datesRange: Object;
    currenciesChartElement: Element;
    currenciesChart: Object;


    tmcValuesObs: Observable<TMCs>;
    tmcValues: any;
    tmcChartInfo: Object;

    tmcDatesRange: Object;
    tmcChartElement: Element;
    tmcChart: Object;


  constructor(private http:HttpClient, private calendar: NgbCalendar) {
  }

    ngOnInit() {
        this.currenciesChartElement = document.getElementById("currenciesChart");
        this.ufValues = [];
        this.ufChartInfo = {labels: [], data: []};
        this.ufMax = this.ufMin = this.ufAvg = 0;
        this.usdValues = [];
        this.usdChartInfo = {labels: [], data: []};
        this.usdMax = this.usdMin = this.usdAvg = 0;

        this.tmcValues = [];
        this.tmcChartInfo = {labels: [], data: [], type: []};
        this.tmcChartElement = document.getElementById("tmcChart");

        this.currenciesChart = {
            type: 'line',
            data:{
                datasets:[
                {
                    label: "UF", 
                    yAxisID: 'y-axis-1',
                    borderColor: "#D25300",
                    backgroundColor: "#D25300",
                    fill: false,
                    data: []
                },
                {
                    label: "Dólar", 
                    yAxisID: 'y-axis-2',
                    borderColor: "#14BF00",
                    backgroundColor: "#14BF00",
                    fill: false,
                    data: []
                }
                ],

                labels: [],
            },
            options: {
                responsive: false,
                maintainAspectRatio: true,
                scales: {
                    yAxes: [
                        {
                            type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                            display: true,
                            position: 'left',
                            id: 'y-axis-1',
                        }, 
                        {
                            type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                            display: true,
                            position: 'right',
                            id: 'y-axis-2',
                            gridLines: {
                                drawOnChartArea: false
                            }
                        }
                    ],
                },
            }
        };


        this.tmcChart = {
          type: 'line',
          data:{
              datasets:[
              {
                  fill: false,
                  data: []
              },
              ],

              labels: [],
          },
          options: {
              responsive: false,
              maintainAspectRatio: true,
          }
      };

        let chart = new Chart(this.currenciesChartElement, this.currenciesChart);
        let chartTmc = new Chart(this.tmcChartElement, this.tmcChart);
    }

  updateDatesRange(dates: any){
    console.log('change fechas:',dates);
    this.datesRange = dates;
    this.ufValuesObs = this.http
          .get("https://api.sbif.cl/api-sbifv3/recursos_api/uf/periodo/"+dates.from.year+"/"+dates.from.month+"/dias_i/"+dates.from.day+"/"+dates.to.year+"/"+dates.to.month+"/dias_f/"+dates.to.day,{params})
          .do(console.log).
          catch((err: HttpErrorResponse) => {
            console.log(err);
            this.ufValues=[];
            return throwError(
              'Something bad happened; please try again later.');
          });

    this.usdValuesObs = this.http
          .get("https://api.sbif.cl/api-sbifv3/recursos_api/dolar/periodo/"+dates.from.year+"/"+dates.from.month+"/dias_i/"+dates.from.day+"/"+dates.to.year+"/"+dates.to.month+"/dias_f/"+dates.to.day,{params})
          .do(console.log).
          catch((err: HttpErrorResponse) => {
            console.log(err);
            this.usdValues=[];
            return throwError(
              'Something bad happened; please try again later.');
          });

    this.ufValuesObs.subscribe(
      value => {
          console.log('subscribe UFs',value);
          this.ufValues = value.UFs.slice()
        },
      err => console.error("Error "+err),
      () => {
          this.updateCurrency('uf',this.ufValues,this.ufChartInfo); 
          this.renderChart();
        }
    );

    this.usdValuesObs.subscribe(
        value => {
            console.log('subscribe USDs',value);
            this.usdValues = value.Dolares.slice()
          },
        err => {console.error("Error "+err);this.usdValues=[];},
        () => {
            this.updateCurrency('usd',this.usdValues,this.usdChartInfo); 
            this.renderChart();
        }
    );
  }

  updateCurrency(type: string, newValue: any[], oldValue: any){
    oldValue = {labels: [], data: []};
    console.log('update:',newValue);
    if(newValue){
      let sumUfValues = 0;
      for(let i = 0 ; i< newValue.length; i++){
        oldValue['labels'].push(newValue[i]['Fecha']);
        //maldita sbif api
        oldValue['data'].push(parseFloat(newValue[i]['Valor'].replace('.','').replace(',','.')));
        sumUfValues+=oldValue['data'][i];
      }
      this.ufMax = Math.max(...oldValue['data']);
      this.ufMin = Math.min(...oldValue['data']);
      this.ufAvg = sumUfValues/oldValue.length;
      //console.log(this.ufMax, this.ufMin, this.ufAvg);
    }
    
    if(type=="usd"){
      this.usdChartInfo = JSON.parse(JSON.stringify(oldValue));
    }else{
      this.ufChartInfo = JSON.parse(JSON.stringify(oldValue));
    }
    
    console.log('updatecurrency',oldValue);
    
  }

  updateDatesRangeTMC(dates: any){
    //https://api.sbif.cl/api-sbifv3/recursos_api/tmc/posteriores/2013/01?apikey=SBIF9990SBIF44b7SBIF7f4c5a537d02358e1099&formato=xml

    console.log('change fechas TMC:',dates);
    this.tmcDatesRange = dates;
    this.tmcValuesObs = this.http
          .get("https://api.sbif.cl/api-sbifv3/recursos_api/tmc/periodo/"+dates.from.year+"/"+dates.from.month+"/"+dates.to.year+"/"+dates.to.month,{params})
          .do(console.log).
          catch((err: HttpErrorResponse) => {
            console.log(err);
            this.tmcValues=[];
            return throwError(
              'Something bad happened; please try again later.');
          });

    this.tmcValuesObs.subscribe(
      value => {
          console.log('subscribe TMC',value);
          this.tmcValues = value.TMCs.slice()

        },
        err =>{console.error("Error "+err);this.tmcValues=[];},
        () => {
          this.updateTMC(this.tmcValues);
          this.renderChartTMC();
        }
      );

  }

  //funciona un poco diferente a los otros, asi que otra función
  updateTMC(newValue: any[]){
    let oldValue = {labels: [], data: [], type:[]};
    console.log("updateTMC",newValue, oldValue);

    //usamos las fechas de label, eje x (suponemos que vienen ordenadas xD)
    //y aprovechamos el for para sacar los tipos
    
    for(let i = 0; i<newValue.length; i++){
      if(oldValue.labels.indexOf(newValue[i]['Fecha'])<0) oldValue.labels.push(newValue[i]['Fecha']);
      if(oldValue.type.indexOf(newValue[i]['Tipo'])<0) oldValue.type.push(newValue[i]['Tipo']);

    }

    oldValue.type.sort((a,b)=>(a>b)?1:-1);
    
    for(let i = 0; i<oldValue['type'].length; i++){
      oldValue['data'].push([]);
    }
    
    //ahora los datos, una curva por tipo
    for(let i = 0; i<newValue.length; i++){
      let index = oldValue['type'].indexOf(newValue[i]['Tipo']);
      oldValue['data'][index].push(newValue[i]['Valor']);
    }
    this.tmcChartInfo = JSON.parse(JSON.stringify(oldValue));


  }


  renderChart(){
    console.log('renderChart',this.ufChartInfo,this.usdChartInfo);
    this.currenciesChart['data']['datasets'][0]['data'] = this.ufChartInfo['data'];
    this.currenciesChart['data']['datasets'][1]['data'] = this.usdChartInfo['data'];
    this.currenciesChart['data']['labels'] = this.ufChartInfo['labels'];

    //this.currenciesChart['data']['datasets'][1]['labels'] = this.usdChartInfo['labels'];
    let myLineChart = new Chart(this.currenciesChartElement, this.currenciesChart);
  }

  renderChartTMC(){
    console.log('renderChartTMC:', this.tmcChartInfo);
    console.log('renderChartTMC',this.tmcChartInfo['labels']);
    //ahora los datos en la forma del chart
    for(let i=0; i<this.tmcChartInfo['type'].length; i++){
      this.tmcChart['data']['datasets'].push([]);
      this.tmcChart['data']['datasets'][i] = {data: this.tmcChartInfo['data'][i],
      label: this.tmcChartInfo['type'][i], 
      fill: false,};

    }
    this.tmcChart['data']['labels'] = this.tmcChartInfo['labels'];

    console.log(this.tmcChart);
    //console.log(this.currenciesChart);

    //this.currenciesChart['data']['datasets'][1]['labels'] = this.usdChartInfo['labels'];
    let myLineChart = new Chart(this.tmcChartElement, this.tmcChart);

  }



}
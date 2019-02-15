import {Component, OnInit} from '@angular/core';
import 'rxjs/Rx';
import {Observable, throwError} from "rxjs";
import {HttpParams, HttpClient, HttpErrorResponse} from "@angular/common/http";
import * as Chart from 'node_modules/chart.js/dist/Chart.js';

import * as _ from 'lodash';
import {NgbCalendar} from '@ng-bootstrap/ng-bootstrap';
import { faMoneyBillWave, faChartLine, faChartBar } from '@fortawesome/free-solid-svg-icons';


import * as TMCtypes from '../assets/tmc.json';



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
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
    tmcTypes: any[];

    //FontAwesome :)
    faMoneyBillWave = faMoneyBillWave;
    faChartLine = faChartLine;
    faChartBar = faChartBar;

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
    tmcMaxValues: any[];


  constructor(private http:HttpClient, private calendar: NgbCalendar) {
  }

    ngOnInit() {
      console.log(TMCtypes.default);
        this.tmcTypes= TMCtypes.default;
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
        this.tmcMaxValues = [];

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
                            scaleLabel:{
                              display: true,
                              labelString: 'CLP'
                            },
                        }, 
                        {
                            type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                            display: true,
                            position: 'right',
                            id: 'y-axis-2',
                            scaleLabel:{
                              display: true,
                              labelString: 'CLP'
                            },
                            gridLines: {
                                drawOnChartArea: false
                            }
                        }
                    ],
                    xAxes:[{
                      scaleLabel:{
                        display: true,
                        labelString: 'Fechas'
                      },

                    }]
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
              legend: {position: 'bottom'}
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
              'Error!');
          });

    this.ufValuesObs.subscribe(
      value => {
          console.log('subscribe UFs',value);
          this.ufValues = value.UFs.slice()
        },
      err => console.error("Error "+err),
      () => {
          this.updateCurrency('uf',this.ufValues); 
          this.renderChartCurrencies();
        }
    );

    this.usdValuesObs.subscribe(
        value => {
            console.log('subscribe USDs',value);
            this.usdValues = value.Dolares.slice()
          },
        err => {console.error("Error "+err);this.usdValues=[];},
        () => {
            this.updateCurrency('usd',this.usdValues); 
            this.renderChartCurrencies();
        }
    );
  }

  updateCurrency(type: string, newValue: any[]){
    let currentValue = {labels: [], data: []};
    console.log('update:',newValue);
    if(newValue){
      let sumUfValues = 0;
      for(let i = 0 ; i< newValue.length; i++){
        currentValue['labels'].push(newValue[i]['Fecha']);
        //maldita sbif api
        currentValue['data'].push(parseFloat(newValue[i]['Valor'].replace('.','').replace(',','.')));
        sumUfValues+=currentValue['data'][i];
      }
      if(type=="usd"){
        this.ufMax = Math.max(...currentValue['data']);
        this.ufMin = Math.min(...currentValue['data']);
        this.ufAvg = sumUfValues/currentValue['data'].length;
      }else{
        this.usdMax = Math.max(...currentValue['data']);
        this.usdMin = Math.min(...currentValue['data']);
        this.usdAvg = sumUfValues/currentValue['data'].length;

      }
    }
    
    if(type=="usd"){
      this.usdChartInfo = JSON.parse(JSON.stringify(currentValue));
    }else{
      this.ufChartInfo = JSON.parse(JSON.stringify(currentValue));
    }
    
    console.log('updatecurrency',currentValue);
    
  }

  updateDatesRangeTMC(dates: any){
    console.log('change fechas TMC:',dates);
    this.tmcDatesRange = dates;
    this.tmcValuesObs = this.http
          .get("https://api.sbif.cl/api-sbifv3/recursos_api/tmc/periodo/"+dates.from.year+"/"+dates.from.month+"/"+dates.to.year+"/"+dates.to.month,{params})
          .do(console.log).
          catch((err: HttpErrorResponse) => {
            console.log(err);
            this.tmcValues=[];
            return throwError(
              'Error!');
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
    let currentValue = {labels: [], data: [], type:[]};
    let allValuesByType = [];
    console.log("updateTMC",newValue, currentValue);

    //usamos las fechas de label, eje x (suponemos que vienen ordenadas xD)
    //y aprovechamos el for para sacar los tipos
    
    for(let i = 0; i<newValue.length; i++){
      if(currentValue.labels.indexOf(newValue[i]['Fecha'])<0) currentValue.labels.push(newValue[i]['Fecha']);
      if(currentValue.type.indexOf(newValue[i]['Tipo'])<0) currentValue.type.push(newValue[i]['Tipo']);

      allValuesByType.push({type: newValue[i]['Tipo'], value: newValue[i]['Valor']});

    }
    this.tmcMaxValues = [];
    for(let i = 0; i < currentValue.type.length; i++){
      let valuesType = allValuesByType.filter( valueType => valueType.type === currentValue.type[i] );
      console.log('valuesType',valuesType);
      let valueMax = Math.max.apply(Math, valuesType.map( x => x.value));
      console.log(valueMax);
      this.tmcMaxValues.push({x:valuesType[0].type,y:valueMax});
      
    }
    console.log('maxValuesByType', this.tmcMaxValues);

    currentValue.type.sort((a,b)=>(a>b)?1:-1);
    
    for(let i = 0; i<currentValue['type'].length; i++){
      currentValue['data'].push([]);
    }
    
    //ahora los datos, una curva por tipo
    for(let i = 0; i<newValue.length; i++){
      let index = currentValue['type'].indexOf(newValue[i]['Tipo']);
      currentValue['data'][index].push(newValue[i]['Valor']);
    }
    this.tmcChartInfo = JSON.parse(JSON.stringify(currentValue));
  }

  renderChartCurrencies(){
    console.log('renderChart',this.ufChartInfo,this.usdChartInfo);
    this.currenciesChart['data']['datasets'][0]['data'] = this.ufChartInfo['data'];
    this.currenciesChart['data']['datasets'][1]['data'] = this.usdChartInfo['data'];
    this.currenciesChart['data']['labels'] = this.ufChartInfo['labels'];

    //this.currenciesChart['data']['datasets'][1]['labels'] = this.usdChartInfo['labels'];
    let myLineChart = new Chart(this.currenciesChartElement, this.currenciesChart);
  }

  renderChartTMC(){
    //console.log('renderChartTMC:', this.tmcChartInfo);
    //console.log('renderChartTMC',this.tmcChartInfo['labels']);
    this.tmcChart['data']['datasets'] = [];
    //ahora los datos en la forma del chart
    for(let i=0; i<this.tmcChartInfo['type'].length; i++){
      this.tmcChart['data']['datasets'].push([]);
      this.tmcChart['data']['datasets'][i] = {
        data: this.tmcChartInfo['data'][i],
        label: this.tmcChartInfo['type'][i],//+ TMCtypes.default.find( tmc => tmc.id ===  this.tmcChartInfo['type'][i]).description, 
        fill: false,
      };
     
    }
    this.tmcChart['data']['datasets'].push([]);
    this.tmcChart['data']['datasets'][this.tmcChartInfo['type'].length] = {
      data: this.tmcMaxValues,
      label: 'Max values'
    };
    this.tmcChart['data']['labels'] = this.tmcChartInfo['labels'];

    console.log(this.tmcChart);
    //console.log(this.currenciesChart);

    //this.currenciesChart['data']['datasets'][1]['labels'] = this.usdChartInfo['labels'];
    let myLineChart = new Chart(this.tmcChartElement, this.tmcChart);

  }

}
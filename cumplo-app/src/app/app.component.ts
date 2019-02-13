import {Component, OnInit} from '@angular/core';
import 'rxjs/Rx';
import {Observable, throwError} from "rxjs";
import {HttpParams, HttpClient, HttpErrorResponse} from "@angular/common/http";
import * as Chart from 'node_modules/chart.js/dist/Chart.js';

import * as _ from 'lodash';
import {NgbCalendar} from '@ng-bootstrap/ng-bootstrap';

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

const params = new HttpParams()
    .set('apikey', 'f6c5ce74360b06e431f52145b91731f13f7f901f')
    .set('formato', "json");

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit {
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
    ufChartElement: Element;
    ufChart: Object;


  constructor(private http:HttpClient, private calendar: NgbCalendar) {
  }

    ngOnInit() {
        this.ufChartElement = document.getElementById("ufChart");
        this.ufValues = [];
        this.ufChartInfo = {labels: [], data: []};
        this.ufMax = this.ufMin = this.ufAvg = 0;
        this.usdValues = [];
        this.usdChartInfo = {labels: [], data: []};
        this.usdMax = this.usdMin = this.usdAvg = 0;


        this.ufChart = {
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

        let chart = new Chart(this.ufChartElement, this.ufChart);
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
          this.updateCurrency(this.ufValues,this.ufChartInfo); 
          this.renderChart();
        }
    );

    this.usdValuesObs.subscribe(
        value => {
            console.log('subscribe USDs',value);
            this.ufValues = value.Dolares.slice()
          },
        err => {console.error("Error "+err);this.usdValues=[];},
        () => {
            this.updateCurrency(this.usdValues,this.usdChartInfo); 
            this.renderChart();
        }
    );
  }

  updateCurrency(newValue: any[], oldValue: any){
    oldValue = {labels: [], data: []};
    
    if(newValue){
      let sumUfValues = 0;
      for(let i = 0 ; i< newValue.length; i++){
        oldValue['labels'].push(newValue[i]['Fecha']);
        oldValue['data'].push(parseFloat(newValue[i]['Valor'].replace('.','').replace(',','.')));
        sumUfValues+=oldValue['data'][i];
      }
      this.ufMax = Math.max(...oldValue['data']);
      this.ufMin = Math.min(...oldValue['data']);
      this.ufAvg = sumUfValues/oldValue.length;
      //console.log(this.ufMax, this.ufMin, this.ufAvg);
    }
    
  }

  /*
  updateData(){
    this.ufChartInfo = {labels: [], data: []};
    this.usdChartInfo = {labels: [], data: []};
    
    if(this.ufValues){
      let sumUfValues = 0;
      for(let i = 0 ; i< this.ufValues.length; i++){
        this.ufChartInfo['labels'].push(this.ufValues[i]['Fecha']);
        this.ufChartInfo['data'].push(parseFloat(this.ufValues[i]['Valor'].replace('.','').replace(',','.')));
        sumUfValues+=this.ufChartInfo['data'][i];
      }
      this.ufMax = Math.max(...this.ufChartInfo['data']);
      this.ufMin = Math.min(...this.ufChartInfo['data']);
      this.ufAvg = sumUfValues/this.ufValues.length;
      //console.log(this.ufMax, this.ufMin, this.ufAvg);
    }
    if(this.usdValues){
      let sumUsdValues = 0;

      for(let i = 0 ; i< this.usdValues.length; i++){
        //console.log(i,this.ufValues[i]);
        this.usdChartInfo['labels'].push(this.usdValues[i]['Fecha']);
        this.usdChartInfo['data'].push(parseFloat(this.usdValues[i]['Valor'].replace('.','').replace(',','.')));
        sumUsdValues+=this.usdChartInfo['data'][i];
      }

      this.usdMax = Math.max(...this.usdChartInfo['data']);
      this.usdMin = Math.min(...this.usdChartInfo['data']);
      this.usdAvg = sumUsdValues/this.usdValues.length;
      //console.log(this.usdMax, this.usdMin, this.usdAvg);

    }

    //console.log(this.ufChartInfo, this.usdChartInfo);
  }*/

  renderChart(){
    console.log('renderChart',this.ufChartInfo['labels']);
    this.ufChart['data']['datasets'][0]['data'] = this.ufChartInfo['data'];
    this.ufChart['data']['datasets'][1]['data'] = this.usdChartInfo['data'];
    this.ufChart['data']['labels'] = this.ufChartInfo['labels'];
    console.log(this.ufChart);

    //this.ufChart['data']['datasets'][1]['labels'] = this.usdChartInfo['labels'];
    let myLineChart = new Chart(this.ufChartElement, this.ufChart);
  }


}
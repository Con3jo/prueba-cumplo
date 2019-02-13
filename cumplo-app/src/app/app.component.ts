import {Component, OnInit} from '@angular/core';
import 'rxjs/Rx';
import {Observable, throwError} from "rxjs";
import {HttpParams, HttpClient, HttpErrorResponse} from "@angular/common/http";
import * as Chart from 'node_modules/chart.js/dist/Chart.js';

import * as _ from 'lodash';
import {NgbDate, NgbCalendar} from '@ng-bootstrap/ng-bootstrap';

interface UF {
    Fecha: string;
    Valor:string;
}
interface UFs{
    UFs: UF[];
}

const params = new HttpParams()
    .set('apikey', 'f6c5ce74360b06e431f52145b91731f13f7f901f')
    .set('formato', "json");

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit {
    ufValuesObs: Observable<any>;
    ufValues: any;
    datesRange: Object;
    ufChartElement: Element;
    ufChart: Object;
    ufChartInfo: Object;
    ufMax: number;
    ufMin: number;
    ufAvg: number;

    usdValuesObs: Observable<any>;
    usdValues: any;
    usdChartInfo: Object;
    usdMax: number;
    usdMin: number;
    usdAvg: number;


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
          .do(console.log);

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
      value => this.ufValues = value.UFs.slice(),
      err => console.error("Error "+err),
      () => {
          //console.log('Observer got a complete notification',this.ufValues); 
          this.updateData(); 
          this.renderChart();
        }
    );

    this.usdValuesObs.subscribe(
        value => this.usdValues = value.Dolares.slice(),
        err => {console.error("Error "+err);this.usdValues=[];},
        () => {
            //console.log('Observer got a complete notification',this.usdValues); 
            this.updateData(); 
            this.renderChart();
        }
    );
  }

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
  }

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
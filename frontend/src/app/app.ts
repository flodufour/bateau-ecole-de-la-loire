import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/components/footer/footer';
import { Header } from './shared/components/header/header';
import { LoadingBar } from './shared/components/loading-bar/loading-bar';
import { WaveBackground } from './shared/components/wave-background/wave-background';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, LoadingBar, WaveBackground],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}

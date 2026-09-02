import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  templateUrl: './loading-bar.html',
  styleUrl: './loading-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBar {
  private readonly loading = inject(LoadingService);
  protected readonly isLoading = this.loading.isLoading;
}

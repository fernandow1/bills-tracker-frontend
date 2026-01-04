import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { IBillResponse } from '@features/bill/interfaces';
import { NetUnits } from '@features/bill/enums/net-units.enum';
import { CurrencyFormatPipe } from '@shared/pipes';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatCardModule,
    MatDividerModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './bill-detail.html',
  styleUrl: './bill-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillDetail {
  public readonly displayedColumns: string[] = [
    'product',
    'quantity',
    'contentValue',
    'netUnit',
    'unitPrice',
    'subtotal',
  ];

  private readonly dialogRef = inject(MatDialogRef<BillDetail>);
  public readonly bill = inject<IBillResponse>(MAT_DIALOG_DATA);

  public close(): void {
    this.dialogRef.close();
  }

  public edit(): void {
    this.dialogRef.close({ action: 'edit', bill: this.bill });
  }

  public delete(): void {
    if (confirm(`¿Está seguro de eliminar la factura #${this.bill.id}?`)) {
      this.dialogRef.close({ action: 'delete', bill: this.bill });
    }
  }

  public getNetUnitLabel(netUnit: NetUnits): string {
    const labels: Record<NetUnits, string> = {
      [NetUnits.UNIT]: 'Unidad',
      [NetUnits.GRAM]: 'Gramo',
      [NetUnits.KILOGRAM]: 'Kilogramo',
      [NetUnits.MILLILITER]: 'Mililitro',
      [NetUnits.LITER]: 'Litro',
    };
    return labels[netUnit] || netUnit;
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  /**
   * Formatea un número como moneda argentina
   * Si no tiene centavos, muestra solo los enteros
   * @param value Valor numérico a formatear
   * @param symbol Símbolo de la moneda (por defecto '$')
   * @returns String formateado
   */
  public transform(value: number | null | undefined, symbol = '$'): string {
    if (value === null || value === undefined || isNaN(value)) {
      return `${symbol} 0`;
    }

    // Verificar si tiene centavos
    const hasCents = Math.abs(value % 1) > 0.001;

    let formattedValue: string;

    if (hasCents) {
      // Formatear con 2 decimales
      const [integer, decimal] = Math.abs(value).toFixed(2).split('.');
      // Agregar separador de miles (punto)
      const integerFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      formattedValue = `${integerFormatted},${decimal}`;
    } else {
      // Formatear solo enteros
      const integer = Math.floor(Math.abs(value)).toString();
      // Agregar separador de miles (punto)
      formattedValue = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Agregar signo negativo si corresponde
    const sign = value < 0 ? '-' : '';

    return `${sign}${symbol} ${formattedValue}`;
  }
}

const readline = require('readline');
const Joi = require('joi');

const indicatorPattern = /^\s*\d+\s*$/; // число, возможно с пробелами вокруг
const decimal = 10; // 10-ая система счисления

const schemaNumber = Joi.number().min(1).required().error(() => {
  throw new Error('Число должно быть от 1');
});

const schemaIndicator = Joi.array().items(Joi.string().pattern((indicatorPattern)).required()).required().error(() => {
  throw new Error('Индикатор должен быть числом');
});

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    readlineInterface.question(prompt, resolve);
  });
}

async function processInput() {
  try {
    const inputDepartmentCount = await question('Введите количество отделов: ');
    const departmentCount = await schemaNumber.validateAsync(inputDepartmentCount, { context: true, convert: true });

    const departments = [];

    for (const [index] of Array(departmentCount).entries()) {
      const line = await question(`Введите индикаторы отдела ${index + 1}: `);
      const indicators = line.split(', ').map(number => number.trim());
      const validatedIndicators = await schemaIndicator.validateAsync(indicators, { context: true, convert: true });
      departments.push(validatedIndicators.map(num => parseInt(num, decimal)));
    }

    const inputThreshold = await question('Введите порог стабильности: ');
    const threshold = await schemaNumber.validateAsync(inputThreshold, { context: true, convert: true });

    departments.forEach((indicators, departmentIndex) => {
      const baseIndicator = indicators[0];
      const baseDigits = new Set(String(baseIndicator).split(''));
      let specialSum = 0;

      for (let indicatorIndex = 1; indicatorIndex < indicators.length; indicatorIndex++) {
        const currentIndicator = indicators[indicatorIndex];

        if (currentIndicator > baseIndicator) {
          const currentDigits = new Set(String(currentIndicator).split(''));
          const hasCommonDigits = [...currentDigits].some(digit => baseDigits.has(digit));

          if (!hasCommonDigits) {
            specialSum += currentIndicator;
          }
        }
      }

      console.log(`Отдел ${departmentIndex + 1}: ${specialSum > threshold ? 'CRASH' : 'OK'}`);
    });
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    readlineInterface.close();
  }
}

processInput();
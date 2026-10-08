// Use Japanese validation messages even when the visitor's browser UI is English.
document.addEventListener('invalid', event => {
  const input=event.target, validity=input.validity;
  if (validity.customError) return;
  let message='入力内容を確認してください。';
  if (validity.valueMissing) message=input.type==='checkbox'?'説明を確認して同意してください。':'この項目を入力してください。';
  else if (validity.typeMismatch) message='有効なメールアドレスを入力してください。';
  else if (validity.rangeOverflow) message=`${input.max}以下の数値を入力してください。`;
  else if (validity.rangeUnderflow) message=`${input.min}以上の数値を入力してください。`;
  else if (validity.stepMismatch || validity.badInput) message='有効な整数を入力してください。';
  else if (validity.tooShort) message=`${input.minLength}文字以上で入力してください。`;
  else if (validity.patternMismatch) message='半角数字で入力してください。桁区切りのカンマも使用できます。';
  input.setCustomValidity(message);
  input.dataset.localeValidity='true';
},true);
document.addEventListener('input', event => {
  if(event.target.dataset.localeValidity){event.target.setCustomValidity('');delete event.target.dataset.localeValidity;}
},true);
document.addEventListener('reset',event=>{
  for(const input of event.target.elements) if(input.dataset.localeValidity){input.setCustomValidity('');delete input.dataset.localeValidity;}
},true);

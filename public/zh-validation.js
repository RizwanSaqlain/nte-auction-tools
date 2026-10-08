// Use Chinese validation messages even when the visitor's browser UI is English.
document.addEventListener('invalid', event => {
  const input=event.target, validity=input.validity;
  if (validity.customError) return;
  let message='请检查输入内容。';
  if (validity.valueMissing) message=input.type==='checkbox'?'请阅读说明并确认同意。':'请填写此项。';
  else if (validity.typeMismatch) message='请输入有效的电子邮箱地址。';
  else if (validity.rangeOverflow) message=`请输入不大于${input.max}的数值。`;
  else if (validity.rangeUnderflow) message=`请输入不小于${input.min}的数值。`;
  else if (validity.stepMismatch || validity.badInput) message='请输入有效的整数。';
  else if (validity.tooShort) message=`请至少输入${input.minLength}个字符。`;
  else if (validity.patternMismatch) message='请输入半角数字，可使用逗号分隔千位。';
  input.setCustomValidity(message);
  input.dataset.localeValidity='true';
},true);
document.addEventListener('input', event => {
  if(event.target.dataset.localeValidity){event.target.setCustomValidity('');delete event.target.dataset.localeValidity;}
},true);
document.addEventListener('reset',event=>{
  for(const input of event.target.elements) if(input.dataset.localeValidity){input.setCustomValidity('');delete input.dataset.localeValidity;}
},true);

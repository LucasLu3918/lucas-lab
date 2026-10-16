import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { BaseBadge, BaseButton, BaseCard, BaseNotice, BaseTextField } from '../index';

describe('Vue shared base components', () => {
  it('exposes typed button variants and blocks interaction while loading', async () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'primary', loading: true },
      slots: { default: '儲存' },
    });

    expect(wrapper.get('button').classes()).toContain('ll-button--primary');
    expect(wrapper.get('button').attributes('type')).toBe('button');
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true');
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true);
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('renders a stable semantic badge variant', () => {
    const wrapper = mount(BaseBadge, {
      props: { tone: 'success' },
      slots: { default: '已完成' },
    });

    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('ll-badge--success');
    expect(wrapper.text()).toBe('已完成');
  });

  it('allows a card to choose an appropriate semantic container', () => {
    const wrapper = mount(BaseCard, {
      props: { as: 'section', elevation: 'raised' },
      slots: { default: '作品摘要' },
    });

    expect(wrapper.element.tagName).toBe('SECTION');
    expect(wrapper.classes()).toContain('ll-card--raised');
  });

  it('announces errors assertively and routine notices politely', () => {
    const error = mount(BaseNotice, { props: { tone: 'error' }, slots: { default: '請修正欄位' } });
    const info = mount(BaseNotice, { props: { tone: 'info' }, slots: { default: '已更新' } });

    expect(error.attributes('role')).toBe('alert');
    expect(error.attributes('aria-live')).toBe('assertive');
    expect(info.attributes('role')).toBe('status');
    expect(info.attributes('aria-live')).toBe('polite');
  });

  it('connects text input labels, descriptions and validation errors', async () => {
    const wrapper = mount(BaseTextField, {
      props: {
        label: '電子郵件',
        modelValue: '',
        description: '用於閱讀通知',
        error: '請輸入有效地址',
        required: true,
      },
    });
    const input = wrapper.get('input');
    const inputId = input.attributes('id');

    expect(wrapper.get('label').attributes('for')).toBe(inputId);
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toContain(`${inputId}-hint`);
    expect(input.attributes('aria-describedby')).toContain(`${inputId}-error`);
    expect(wrapper.get('[role="alert"]').text()).toBe('請輸入有效地址');
    await input.setValue('reader@example.com');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['reader@example.com']);
  });
});

import { Component } from 'react';

// Chặn lỗi khi render: một lỗi nhỏ ở một trang không được làm trắng cả ứng dụng
// (quan trọng khi demo/bảo vệ đề tài). Hiển thị thông báo + nút tải lại.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Lỗi hiển thị giao diện:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="page-panel" style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
          <h2>Có lỗi khi hiển thị trang</h2>
          <p className="muted">Bạn tải lại trang giúp mình nhé. Nếu vẫn lỗi, gửi nội dung lỗi dưới đây qua ô “Góp ý” ở trang Về dự án.</p>
          <p className="muted" style={{ fontSize: 12, opacity: 0.75, wordBreak: 'break-word' }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            className="btn-ghost"
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}

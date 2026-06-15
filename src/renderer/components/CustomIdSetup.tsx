import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface CustomIdSetupProps {
  onComplete: (identity: any) => void;
  onCancel: () => void;
}

type IdMode = 'canonical' | 'hybrid' | 'custom' | 'hierarchical';

interface IdValidation {
  isValid: boolean;
  message: string;
  suggestions?: string[];
}

export const CustomIdSetup: React.FC<CustomIdSetupProps> = ({
  onComplete,
  onCancel
}) => {
  const [idMode, setIdMode] = useState<IdMode>('hybrid');
  const [customInput, setCustomInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [validation, setValidation] = useState<IdValidation>({ isValid: false, message: '' });
  const [isChecking, setIsChecking] = useState(false);
  const [previewId, setPreviewId] = useState('');

  // 模拟的验证函数
  const validateCustomId = async (input: string): Promise<IdValidation> => {
    if (!input) {
      return { isValid: false, message: '请输入用户ID' };
    }

    // 格式验证
    const formatRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,31}$/;
    if (!formatRegex.test(input)) {
      return {
        isValid: false,
        message: 'ID格式无效：必须以字母开头，3-32个字符，只能包含字母、数字、下划线和连字符'
      };
    }

    // 检查连续特殊字符
    if (/[_-]{2,}/.test(input)) {
      return {
        isValid: false,
        message: '不能包含连续的下划线或连字符'
      };
    }

    // 检查保留词
    const reservedWords = ['admin', 'root', 'system', 'veilconnect', 'support'];
    if (reservedWords.includes(input.toLowerCase())) {
      return {
        isValid: false,
        message: '此ID为保留词，请选择其他ID'
      };
    }

    // 模拟网络检查
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟一些ID已被占用
    const takenIds = ['alice', 'bob', 'charlie', 'admin'];
    if (takenIds.includes(input.toLowerCase())) {
      return {
        isValid: false,
        message: '此ID已被占用',
        suggestions: [
          `${input}2024`,
          `${input}_crypto`,
          `${input}_dev`,
          `${input}123`,
          `_${input}`
        ]
      };
    }

    return { isValid: true, message: 'ID可用！' };
  };

  // 生成预览ID
  const generatePreview = (input: string, mode: IdMode): string => {
    if (!input) return '';

    switch (mode) {
      case 'canonical':
        return '2NEpo7TZRRrLGo6jkBkXfvmuYup';
      case 'hybrid':
        return `${input}#f4e2d1c8`;
      case 'custom':
        return input;
      case 'hierarchical':
        return `community.crypto.${input}:a1b2`;
      default:
        return input;
    }
  };

  // 处理输入变化
  useEffect(() => {
    const preview = generatePreview(customInput, idMode);
    setPreviewId(preview);

    if (customInput && (idMode === 'hybrid' || idMode === 'custom')) {
      setIsChecking(true);
      validateCustomId(customInput).then(result => {
        setValidation(result);
        setIsChecking(false);
      });
    } else {
      setValidation({ isValid: true, message: '' });
    }
  }, [customInput, idMode]);

  const handleCreate = async () => {
    try {
      // 这里应该调用实际的身份创建API
      const identity = {
        customId: previewId,
        idType: idMode,
        nickname: nickname || '匿名用户',
        createdAt: Date.now()
      };

      onComplete(identity);
    } catch (error) {
      console.error('创建身份失败:', error);
    }
  };

  const canCreate = () => {
    if (idMode === 'canonical') return true;
    return validation.isValid && customInput.length > 0;
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        设置您的用户ID
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        选择您喜欢的ID类型。您可以随时在设置中更改。
      </Typography>

      {/* ID模式选择 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ID类型
        </Typography>
        <RadioGroup
          value={idMode}
          onChange={(e) => setIdMode(e.target.value as IdMode)}
        >
          <FormControlLabel
            value="canonical"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">默认ID (推荐)</Typography>
                <Typography variant="caption" color="text.secondary">
                  基于公钥生成，最安全
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="hybrid"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">混合ID</Typography>
                <Typography variant="caption" color="text.secondary">
                  自定义名称 + 安全后缀
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="custom"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">纯自定义ID</Typography>
                <Typography variant="caption" color="text.secondary">
                  完全自定义，需要网络预留
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="hierarchical"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1">分层ID</Typography>
                <Typography variant="caption" color="text.secondary">
                  组织化的层级结构
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </Box>

      {/* 自定义输入 */}
      {(idMode === 'hybrid' || idMode === 'custom' || idMode === 'hierarchical') && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="自定义ID"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={idMode === 'hierarchical' ? 'username' : 'your_custom_id'}
            helperText="3-32个字符，字母开头，可包含数字、下划线、连字符"
            error={!validation.isValid && customInput.length > 0}
            InputProps={{
              endAdornment: isChecking ? (
                <CircularProgress size={20} />
              ) : validation.isValid && customInput ? (
                <CheckIcon color="success" />
              ) : customInput && !validation.isValid ? (
                <ErrorIcon color="error" />
              ) : null
            }}
          />
          
          {/* 验证消息 */}
          {customInput && (
            <Box sx={{ mt: 1 }}>
              {validation.isValid ? (
                <Alert severity="success" icon={<CheckIcon />}>
                  {validation.message}
                </Alert>
              ) : (
                <Alert severity="error" icon={<ErrorIcon />}>
                  {validation.message}
                </Alert>
              )}
            </Box>
          )}

          {/* 建议列表 */}
          {validation.suggestions && validation.suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                建议的可用ID：
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {validation.suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    onClick={() => setCustomInput(suggestion)}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* 昵称输入 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="昵称 (可选)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="显示给其他用户的名称"
        />
      </Box>

      {/* 预览 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          预览
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            您的用户ID：
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
            {previewId || '请输入自定义ID'}
          </Typography>
          {nickname && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              昵称：{nickname}
            </Typography>
          )}
        </Paper>
      </Box>

      {/* 安全提示 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>安全提示：</strong>
          {idMode === 'canonical' && '默认ID提供最高安全性和匿名性。'}
          {idMode === 'hybrid' && '混合ID在保持安全性的同时提供个性化。'}
          {idMode === 'custom' && '自定义ID可能降低匿名性，请谨慎选择。'}
          {idMode === 'hierarchical' && '分层ID便于组织管理，但可能暴露归属信息。'}
        </Typography>
      </Alert>

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} variant="outlined">
          取消
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!canCreate() || isChecking}
        >
          {isChecking ? '检查中...' : '创建身份'}
        </Button>
      </Box>

      {/* 帮助信息 */}
      <Divider sx={{ my: 3 }} />
      <Box>
        <Typography variant="body2" color="text.secondary">
          <strong>ID类型说明：</strong>
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText
              primary="默认ID"
              secondary="如：2NEpo7TZRRrLGo6jkBkXfvmuYup - 基于公钥生成，绝对唯一"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="混合ID"
              secondary="如：alice#f4e2d1c8 - 自定义部分 + 公钥哈希后缀"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="纯自定义ID"
              secondary="如：alice - 完全自定义，需要网络预留确认"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="分层ID"
              secondary="如：company.dev.alice:a1b2 - 组织化的层级结构"
            />
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
}; 
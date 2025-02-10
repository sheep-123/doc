<?php
namespace app\home\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use Workerman\Worker;

class Websocket extends Command
{
    protected function configure()
    {
        $this->setName('websocket:start')
            ->setDescription('Start WebSocket Server');
    }

    protected function execute(Input $input, Output $output)
    {
        // 创建WebSocket服务器
        $ws = new Worker("websocket://0.0.0.0:2346");
        
        // 设置进程数
        $ws->count = 4;

        // 连接建立时回调
        $ws->onConnect = function ($connection) {
            echo "连接成功\n";
        };

        // 收到消息时回调
        $ws->onMessage = function ($connection, $data) {
            // 处理业务逻辑
            $message = json_decode($data, true);
            
            switch ($message['type']) {
                case 'start_parse':
                  $file_id = $message['data']['file_id']??null;
                  if($file_id){
                    echo "收到文件解析请求，文件ID: {$file_id}\n";
                    // 构建响应数据
                    $response = [
                        'type' => 'parse_response',
                        'code' => 200,
                        'data' => [
                            'file_id' => $file_id,
                            'received_at' => time(),
                            'status' => 'received'
                        ]
                    ];
                    $connection->send(json_encode($response));
                  }
                    break;
                
                // 添加其他消息类型处理
                default:
                    $connection->send(json_encode(['error' => 'unknown message type']));
            }
        };

        // 连接关闭时回调
        $ws->onClose = function ($connection) {
            echo "连接关闭\n";
        };

        // 运行所有服务
        Worker::runAll();
    }
}